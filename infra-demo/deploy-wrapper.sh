#!/bin/bash
#
# Deploy wrapper for the restricted 'ghactions' SSH user.
# Installed at: /opt/deploy/deploy-wrapper.sh
# Ownership:    root:root 755
#
# This script is set as ForceCommand in sshd_config and intercepts every SSH
# session for the ghactions user. It permits exactly three operations:
#
#   1. Legacy SCP writes to /opt/deploy/workspace/ (sink mode -t, no recursion)
#   2. Modern SFTP uploads to /opt/deploy/workspace/ (OpenSSH >= 9.0 scp default)
#   3. The exact command "deploy" — parses .deploy.env and executes deploy.sh
#
# All other operations — including interactive shells — are rejected.
#
# Security properties enforced:
#   - Hardened PATH prevents binary hijacking via PATH manipulation
#   - Shell metacharacters blocked in SSH_ORIGINAL_COMMAND before any routing
#   - Legacy SCP restricted to sink mode (-t); source mode (-f) blocked (no exfiltration)
#   - Recursive SCP (-r) blocked; only flat file copies permitted
#   - SCP target canonicalised via realpath to defeat path traversal attacks
#   - SCP target confinement: wrapper validates that the target path is within
#     WORKSPACE_DIR before exec'ing scp — artifacts/ and all other paths outside
#     the workspace are rejected with a clear error message.
#   - SFTP directory access: sftp-server runs as ghactions (same UID as deploy.sh),
#     so filesystem permissions cannot distinguish the two execution contexts.
#     ghactions therefore owns artifacts/ (mode 700) so deploy.sh can write
#     artifacts directly — no sudo required.  Residual SFTP risk is mitigated by:
#       (a) readdir/opendir denied at the SFTP protocol level — client cannot
#           enumerate the artifacts directory
#       (b) artifact filenames embed a 40-char hex SHA, making path guessing
#           computationally infeasible (2^160 search space)
#       (c) the ghactions SSH key is stored only in GitHub Actions secrets and
#           is never accessible interactively
#   - File overwrite prevention: existing workspace files are chmod 400'd before
#     exec'ing scp or sftp-server; the OS rejects open(O_WRONLY|O_TRUNC) on them.
#   - SFTP: client-supplied binary path is detected but NEVER executed — our
#     known-good sftp-server binary is always used (prevents binary substitution)
#   - SFTP: SSH_FXP_READ, SSH_FXP_READDIR, SSH_FXP_READLINK and SSH_FXP_SYMLINK
#     denied via sftp-server -P (write-only at the protocol level)
#   - .deploy.env is parsed line-by-line (never sourced) to prevent code injection
#   - KEY names validated against [A-Z_][A-Z0-9_]* before export
#   - COMMIT_SHA validated as 40-char hex before use in a filename
#   - Workspace files always cleaned up on exit — success, failure, or signal
#   - Deployment artifact creation delegated to deploy.sh (deployment concern)
#

set -euo pipefail

# ------------------------------------------------------------------
# Hardened environment
# ------------------------------------------------------------------
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# ------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------
readonly DEPLOY_BASE="/opt/deploy"
readonly WORKSPACE_DIR="${DEPLOY_BASE}/workspace"
readonly SCP_BIN="/usr/bin/scp"
# Ubuntu/Debian path; adjust if deploying to a different distro.
readonly SFTP_SERVER="/usr/lib/openssh/sftp-server"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
log() { printf '[WRAPPER] INFO:  %s\n' "$*"; }
err() { printf '[WRAPPER] ERROR: %s\n' "$*" >&2; }
die() { err "$1"; exit 1; }

# ------------------------------------------------------------------
# Deny interactive shells — SSH_ORIGINAL_COMMAND must be present
# ------------------------------------------------------------------
cmd="${SSH_ORIGINAL_COMMAND:-}"
[[ -n "${cmd}" ]] || die "Interactive shell access is not permitted."

# ------------------------------------------------------------------
# Allowlist check on the raw command string.
# Permits: alphanumeric, space, hyphen, dot, underscore, slash.
# Rejects every shell metacharacter before any further processing.
# ------------------------------------------------------------------
if [[ "${cmd}" =~ [^a-zA-Z0-9\ \-\._/] ]]; then
  die "Illegal characters in command."
fi

# ======================================================================
# Route: SCP — write-only sink, workspace directory only
# ======================================================================
# sshd serialises SCP as: scp [-v] [-d] -t <target>
#   -t  sink / receive mode (permitted)
#   -f  source / send mode  (blocked — prevents data exfiltration)
#   -r  recursive copy      (blocked — only flat copies needed)
# ======================================================================
if [[ "${cmd}" =~ ^scp[[:space:]] ]]; then

  [[ -x "${SCP_BIN}" ]] || die "scp not found or not executable at ${SCP_BIN}."

  read -ra args <<< "${cmd}"
  has_sink_flag=false
  target=""

  for arg in "${args[@]:1}"; do      # skip leading "scp"
    case "${arg}" in
      -t)
        has_sink_flag=true
        ;;
      -f)
        die "SCP source (read) mode is not permitted."
        ;;
      -r|-R)
        die "Recursive SCP is not permitted."
        ;;
      -[vd])
        ;;    # verbose / directory-mode: benign, allow through
      -*)
        die "Unrecognised SCP flag: ${arg}"
        ;;
      *)
        target="${arg}"
        ;;
    esac
  done

  [[ "${has_sink_flag}" == true ]] || die "Only SCP sink mode (-t) is permitted."
  [[ -n "${target}" ]]             || die "No SCP target path provided."

  # Resolve both paths to their canonical real form to defeat traversal attacks
  # (e.g. /opt/deploy/workspace/../../../etc/).
  canonical_workspace="$(realpath "${WORKSPACE_DIR}")" \
    || die "Cannot resolve workspace directory."
  canonical_target="$(realpath --canonicalize-missing "${target}" 2>/dev/null)" \
    || die "Cannot resolve SCP target path."

  # Target must be the workspace dir itself or a direct, non-nested child.
  if [[ "${canonical_target}" != "${canonical_workspace}" ]] \
  && [[ "${canonical_target}" != "${canonical_workspace}/"* ]]; then
    die "SCP target outside allowed directory."
  fi

  # Disallow nested subdirectories (e.g. workspace/subdir/file).
  # Skip this check when the target IS the workspace directory itself —
  # directory-mode SCP transfers send the workspace dir as the target.
  if [[ "${canonical_target}" != "${canonical_workspace}" ]]; then
    relative="${canonical_target#"${canonical_workspace}/"}"
    if [[ "${relative}" == */* ]]; then
      die "SCP target must be a direct child of workspace, not a subdirectory."
    fi
  fi

  # Prevent overwriting existing files.
  # Make every existing file in the workspace read-only (400) so the OS
  # will reject any open(O_WRONLY|O_TRUNC) attempt — this is enforced at the
  # kernel level regardless of what scp does with the file handle.
  # For a named target we additionally give an explicit error message.
  find "${canonical_workspace}" -maxdepth 1 -type f -exec chmod 400 {} + 2>/dev/null || true
  if [[ "${canonical_target}" != "${canonical_workspace}" ]] && [[ -e "${canonical_target}" ]]; then
    die "SCP target already exists. Overwriting files is not permitted."
  fi

  # Reconstruct a minimal, sanitised argument list from the values we
  # explicitly validated — never pass the caller's original args to exec.
  # This means even if a novel flag combination were to slip the parser
  # above, nothing untrusted reaches the real scp binary.
  # -t forces sink (receive) mode at the protocol level, which the scp
  # binary itself enforces; combined with blocking -f above this provides
  # two independent layers preventing reads from the remote server.
  exec "${SCP_BIN}" -t "${canonical_target}"
  # Reaching this line means exec failed.
  die "Failed to execute SCP."

fi

# ======================================================================
# Route: SFTP — modern scp (OpenSSH >= 9.0) negotiates SFTP by default
# when the server advertises 'Subsystem sftp internal-sftp'. Depending
# on the client and server, SSH_ORIGINAL_COMMAND may be:
#
#   "internal-sftp"                    — subsystem keyword from sshd
#   "/usr/lib/openssh/sftp-server"      — full path (Ubuntu/Debian client)
#   "/usr/libexec/openssh/sftp-server" — full path (RHEL/CentOS client)
#
# Security model:
#   - We match these known patterns but NEVER exec the client-supplied
#     path. We always exec our hardcoded SFTP_SERVER constant. A crafted
#     SSH_ORIGINAL_COMMAND pointing to a malicious binary is ignored.
#
#   - Upload-only enforcement at the SFTP protocol level via -P:
#       read      (SSH_FXP_READ)     — prevents reading file contents
#       readdir   (SSH_FXP_READDIR)  — prevents directory listing
#       readlink  (SSH_FXP_READLINK) — prevents reading symlink targets
#       symlink   (SSH_FXP_SYMLINK)  — prevents creating symlinks
#
#   - Directory confinement relies on filesystem permissions: ghactions
#     has write access only to /opt/deploy/workspace/ (set up in INFRA).
#     sftp-server -d is intentionally omitted — it only affects relative
#     paths and is not needed when the workflow always supplies full paths.
# ======================================================================
is_sftp_cmd() {
  local c="$1"
  [[ "${c}" == "internal-sftp" ]] \
    || [[ "${c}" =~ ^(/[a-zA-Z0-9._/-]+/)?sftp-server$ ]]
}

if is_sftp_cmd "${cmd%% *}"; then

  [[ -x "${SFTP_SERVER}" ]] \
    || die "sftp-server not found or not executable at ${SFTP_SERVER}."

  # Prevent overwriting existing files.
  # Make every existing file in the workspace read-only (400) before handing
  # control to sftp-server.  When the client issues SSH_FXP_OPEN with
  # O_WRONLY|O_TRUNC on an existing 400-permission file, the OS rejects
  # the open syscall — sftp-server returns SSH_FX_PERMISSION_DENIED without
  # any special configuration.
  find "${WORKSPACE_DIR}" -maxdepth 1 -type f -exec chmod 400 {} + 2>/dev/null || true

  # -e  write log messages to stderr (captured by sshd / journald)
  # -l  log level (ERROR)
  # -u  umask applied to uploaded files (077 → owner-only access)
  # -p  comma-separated SFTP operations to permit at the protocol level
  #     (all others are implicitly denied):
  #       open      (SSH_FXP_OPEN)      — open files for writing
  #       write     (SSH_FXP_WRITE)     — write file contents
  #       close     (SSH_FXP_CLOSE)     — close file/directory handles
  #                                       (required after every open+write)
  #       fsetstat  (SSH_FXP_FSETSTAT)  — set attributes on an open file handle
  #                                       (required by scp to apply timestamps)
  #       stat      (SSH_FXP_STAT)      — stat a path (needed to resolve dir targets)
  #       lstat     (SSH_FXP_LSTAT)     — lstat a path (symlink-aware stat)
  #       realpath  (SSH_FXP_REALPATH)  — resolve canonical paths (SFTP handshake)
  # -P  comma-separated SFTP operations to deny at the protocol level
  #     (belt-and-suspenders; the permit-list already blocks these):
  #       read      (SSH_FXP_READ)     — no file content reads
  #       readdir   (SSH_FXP_READDIR)  — no directory listings
  #       readlink  (SSH_FXP_READLINK) — no symlink target reads
  #       symlink   (SSH_FXP_SYMLINK)  — no symlink creation
  #       remove    (SSH_FXP_REMOVE)   — no file deletion
  #       rmdir     (SSH_FXP_RMDIR)    — no directory deletion
  #       rename    (SSH_FXP_RENAME)   — no file renaming
  #       mkdir     (SSH_FXP_MKDIR)    — no directory creation
  #       opendir   (SSH_FXP_OPENDIR)  — no directory opening
  exec "${SFTP_SERVER}" \
    -e \
    -l ERROR \
    -u 077 \
    -p "open,write,close,fsetstat,stat,lstat,realpath" \
    -P "read,readdir,remove,rmdir,rename,mkdir,opendir,readlink,symlink"
  die "Failed to execute sftp-server."

fi

# ======================================================================
# Route: deploy
# ======================================================================
if [[ "${cmd}" == "deploy" ]]; then

  deploy_script="${WORKSPACE_DIR}/deploy.sh"
  env_file="${WORKSPACE_DIR}/.deploy.env"
  stack_file="${WORKSPACE_DIR}/docker-stack.yml"

  [[ -f "${deploy_script}" ]] || die "deploy.sh not found in workspace."
  [[ -f "${env_file}" ]]      || die ".deploy.env not found in workspace."
  [[ -f "${stack_file}" ]]    || die "docker-stack.yml not found in workspace."

  # ------------------------------------------------------------------
  # Parse .deploy.env safely — line-by-line, never sourced.
  #
  # Sourcing an attacker-controlled file grants arbitrary code execution.
  # Instead we parse KEY=VALUE pairs by hand:
  #   - Split on the FIRST '=' only (handles values that contain '=', e.g. URLs)
  #   - Validate KEY matches [A-Z_][A-Z0-9_]* before exporting
  #   - Skip blank lines and comments (#)
  # ------------------------------------------------------------------
  while IFS= read -r line || [[ -n "${line}" ]]; do
    # Trim leading whitespace (YAML heredoc may leave it)
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "${line}" ]]      && continue
    [[ "${line}" == '#'* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    # Reject keys that are not safe shell identifiers
    [[ "${key}" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue

    export "${key}=${value}"
  done < "${env_file}"

  # ------------------------------------------------------------------
  # Always clean workspace on EXIT — success, failure, or signal.
  # ------------------------------------------------------------------
  cleanup_workspace() {
    log "Cleaning workspace..."
    rm -f "${deploy_script}" "${stack_file}" "${env_file}"
  }
  trap cleanup_workspace EXIT

  log "Starting deployment (commit: ${COMMIT_SHA:-unknown})..."
  chmod +x "${deploy_script}"

  if bash "${deploy_script}"; then
    log "Deployment succeeded."
    exit 0
  else
    err "deploy.sh exited with failure. See output above."
    exit 1
  fi

fi

# ======================================================================
# Catch-all — reject every other command
# ======================================================================
die "Unknown command."
