#!/bin/bash
#
# Deploy script for Docker Swarm stack.
# Images are read from the environment (BACKEND_IMAGE / FRONTEND_IMAGE).
# Usage: ./deploy.sh
#
# Deployment philosophy:
#   - Desired state is declared via `docker stack deploy`.
#   - Rollback on update failure is handled by Docker Swarm via
#     update_config / rollback_config in the compose file.
#   - This script never calls `docker service update` — it only observes.
#   - On a failed *first* deploy (no previous stack), the script removes
#     the stack to clean up orphaned networks and resources.
#

set -euo pipefail

# ------------------------------------------------------------------
# Helpers (defined early — needed by env validation)
# ------------------------------------------------------------------
log()   { printf '[INFO]  %s\n' "$*"; }
warn()  { printf '[WARN]  %s\n' "$*" >&2; }
err()   { printf '[ERROR] %s\n' "$*" >&2; }
die()   { err "$1"; exit "${2:-1}"; }

# Sanitize output — replace the stack name with *** to avoid leaking secrets.
mask_stack_name() { sed "s/${STACK_NAME}/***/g"; }

# ------------------------------------------------------------------
# Validate required environment variables
# ------------------------------------------------------------------
require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    err "Required environment variable '${name}' is not set."
    return 1
  fi
}

readonly ENV_VARS=(
  STACK_NAME CR_PAT CR_USERNAME DEPLOY_DIR
  BACKEND_IMAGE FRONTEND_IMAGE
  SERVER_PORT JWT_LIFETIME CORS_ORIGIN
  RATE_LIMIT_WINDOW_MS RATE_LIMIT_MAX_REQUESTS
  LOG_LEVEL REQUEST_SIZE_LIMIT
  JWT_SECRET_NAME MONGO_URL_SECRET_NAME
  FRONTEND_SSL_CRT_SECRET_NAME FRONTEND_SSL_PRIVKEY_SECRET_NAME
  SSL_CA_CRT_SECRET_NAME
  NGINX_HTTPS_PORT
  FRONTEND_NGINX_DEF_CONFIG_NAME FRONTEND_NGINX_APP_CONFIG_NAME
)

env_ok=true
for v in "${ENV_VARS[@]}"; do
  require_env "$v" || env_ok=false
done
[[ "$env_ok" == true ]] || die "Missing required environment variables. See above."

# ------------------------------------------------------------------
# Constants (read from environment — set by CI workflow)
# ------------------------------------------------------------------
readonly STACK="${STACK_NAME}"
readonly BACKEND_SERVICE="${STACK}_backend"
readonly FRONTEND_SERVICE="${STACK}_frontend"
readonly CR_PERSONAL_ACCESS_TOKEN="${CR_PAT}"
readonly DEPLOY_TIMEOUT=60
readonly DEPLOY_POLL_INTERVAL=5
readonly STACK_RM_SETTLE_TIME=10
readonly MASKED_BACKEND="***_backend"
readonly MASKED_FRONTEND="***_frontend"

# Returns 0 if the stack already has running services, 1 otherwise.
stack_is_running() {
  local count
  count="$(docker stack services "${STACK}" --format '{{.ID}}' 2>/dev/null | wc -l)" || return 1
  (( ${count//[[:space:]]/} > 0 ))
}

# Cleanup temporary files and registry session on exit.
cleanup() {
  local exit_code=$?
  docker logout ghcr.io &>/dev/null || true
  return "$exit_code"
}

docker_login() {
  [[ -n "${CR_PERSONAL_ACCESS_TOKEN:-}" ]] || return 1
  printf '%s' "${CR_PERSONAL_ACCESS_TOKEN}" \
    | docker login ghcr.io -u "${CR_USERNAME}" --password-stdin &>/dev/null
}

get_service_image() {
  docker service inspect "$1" \
    --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null
}

resolve_image() {
  local image_value="$1" service_name="$2"
  if [[ "${image_value}" == "CURRENT" ]]; then
    get_service_image "${service_name}" || return 2
  else
    printf '%s' "${image_value}"
  fi
}

require_items_exist() {
  local kind="$1"; shift
  local inspect_cmd

  case "${kind}" in
    secret) inspect_cmd="docker secret inspect" ;;
    config) inspect_cmd="docker config inspect" ;;
    *)      die "Unknown kind '${kind}' (expected 'secret' or 'config')" ;;
  esac

  local missing=() placeholder item
  for entry in "$@"; do
    placeholder="${entry%%=*}"
    item="${entry#*=}"
    ${inspect_cmd} "${item}" &>/dev/null || missing+=("${placeholder}")
  done

  if (( ${#missing[@]} > 0 )); then
    for m in "${missing[@]}"; do
      err "Required ${kind} <${m}> does not exist. Create it first."
    done
    return 1
  fi
}

# Check whether a service has converged.
# Prints replica string (e.g. "1/1") to stdout; returns 0 if converged.
check_service_converged() {
  local service_name="$1" replicas running desired
  replicas="$(docker service ls --filter "name=${service_name}" --format '{{.Replicas}}' 2>/dev/null)" || return 1
  [[ -n "${replicas}" ]] || return 1

  running="${replicas%%/*}"
  desired="${replicas##*/}"
  printf '%s' "${replicas}"

  [[ "${running}" == "${desired}" && "${desired}" != "0" ]]
}

get_service_update_state() {
  docker service inspect "$1" \
    --format '{{if .UpdateStatus}}{{.UpdateStatus.State}}{{end}}' 2>/dev/null || true
}

# Wait for a service to settle after a stack deploy (read-only).
# Returns 0 if healthy, 1 otherwise.
wait_for_service() {
  local service_name="$1" timeout="$2" label="${3:-service}"
  local elapsed=0 update_state replicas

  log "Waiting for ${label} to settle (timeout: ${timeout}s)..."

  while (( elapsed < timeout )); do
    update_state="$(get_service_update_state "${service_name}")"

    case "${update_state}" in
      completed)
        log "${label} update completed successfully."
        return 0 ;;
      rollback_completed)
        warn "${label} was rolled back automatically by Docker."
        return 1 ;;
      rollback_paused|paused)
        err "${label} is in '${update_state}' state. Manual intervention required."
        return 1 ;;
      rollback_started)
        warn "${label} rollback in progress..." ;;
      updating|"")
        if replicas="$(check_service_converged "${service_name}")" && [[ -z "${update_state}" ]]; then
          log "${label} converged (${replicas})."
          return 0
        fi ;;
    esac

    sleep "${DEPLOY_POLL_INTERVAL}"
    (( elapsed += DEPLOY_POLL_INTERVAL ))
  done

  local final_replicas
  final_replicas="$(check_service_converged "${service_name}" 2>/dev/null || true)"
  err "${label} did not settle within ${timeout}s (replicas: ${final_replicas:-unknown})."
  return 1
}

report_service_status() {
  local service_name="$1" label="${2:-service}"
  local state replicas
  state="$(get_service_update_state "${service_name}")"
  replicas="$(check_service_converged "${service_name}" 2>/dev/null || true)"
  log "  ${label}:  replicas=${replicas:-unknown}  update_state=${state:-none}"
}

dump_service_tasks() {
  local service_name="$1" label="$2"
  log "Failed tasks for ${label}:"
  docker service ps "${service_name}" \
    --format "table {{.Name}}\t{{.Image}}\t{{.CurrentState}}\t{{.Error}}" \
    --no-trunc 2>/dev/null | mask_stack_name || true
}

verify_network_cleanup() {
  local remaining
  remaining="$(docker network ls --filter "label=com.docker.stack.namespace=${STACK}" --format '{{.Name}}' 2>/dev/null || true)"
  if [[ -n "${remaining}" ]]; then
    warn "Some networks still exist (Docker may need more time to remove them):"
    while IFS= read -r net; do
      warn "  - $(printf '%s' "${net}" | mask_stack_name)"
    done <<< "${remaining}"
  else
    log "Stack resources cleaned up successfully."
  fi
}

verify_swarm_state() {
  local expected="$1"
  local actual
  actual="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || true)"
  [[ "${actual}" == "${expected}" ]] \
    || die "Docker Swarm is not initialized (state: ${actual:-unknown}). Run 'docker swarm init' first."
}

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
cd "${DEPLOY_DIR}/workspace" || die "Cannot cd to deploy directory."
trap cleanup EXIT

# 1. Docker registry login
docker_login || die "Docker login failed."

# 2. Verify Docker Swarm is active
verify_swarm_state "active"

# 3. Record pre-deploy state
STACK_WAS_RUNNING=false
if stack_is_running; then
  STACK_WAS_RUNNING=true
  log "Stack is already running — Docker Swarm will handle rollback on update failure."
else
  log "Stack is not yet running — this is a fresh deploy."
fi

# 4. Resolve images (handle CURRENT placeholder)
_backend_resolved="$(resolve_image "${BACKEND_IMAGE}" "${BACKEND_SERVICE}")" \
  || die "Cannot resolve backend image for backend service."
_frontend_resolved="$(resolve_image "${FRONTEND_IMAGE}" "${FRONTEND_SERVICE}")" \
  || die "Cannot resolve frontend image for frontend service."
readonly BACKEND_IMAGE="${_backend_resolved}" FRONTEND_IMAGE="${_frontend_resolved}"
unset _backend_resolved _frontend_resolved

[[ -n "${BACKEND_IMAGE}" ]]  || die "Backend image resolved to empty string."
[[ -n "${FRONTEND_IMAGE}" ]] || die "Frontend image resolved to empty string."

log "Backend Image:  ${BACKEND_IMAGE}"
log "Frontend Image: ${FRONTEND_IMAGE}"

# 5. Export variables for docker-stack.yml
export NODE_ENV="production" \
       SERVER_PORT JWT_LIFETIME CORS_ORIGIN \
       RATE_LIMIT_WINDOW_MS RATE_LIMIT_MAX_REQUESTS \
       LOG_LEVEL REQUEST_SIZE_LIMIT \
       JWT_SECRET_NAME MONGO_URL_SECRET_NAME \
       FRONTEND_SSL_CRT_SECRET_NAME FRONTEND_SSL_PRIVKEY_SECRET_NAME \
       SSL_CA_CRT_SECRET_NAME \
       NGINX_HTTPS_PORT \
       FRONTEND_NGINX_DEF_CONFIG_NAME FRONTEND_NGINX_APP_CONFIG_NAME \
       BACKEND_IMAGE FRONTEND_IMAGE

# 6. Validate required secrets & configs
declare -ar REQUIRED_SECRETS=(
  "JWT_SECRET_NAME=${JWT_SECRET_NAME}"
  "MONGO_URL_SECRET_NAME=${MONGO_URL_SECRET_NAME}"
  "FRONTEND_SSL_CRT_SECRET_NAME=${FRONTEND_SSL_CRT_SECRET_NAME}"
  "FRONTEND_SSL_PRIVKEY_SECRET_NAME=${FRONTEND_SSL_PRIVKEY_SECRET_NAME}"
  "SSL_CA_CRT_SECRET_NAME=${SSL_CA_CRT_SECRET_NAME}"
)
declare -ar REQUIRED_CONFIGS=(
  "FRONTEND_NGINX_DEF_CONFIG_NAME=${FRONTEND_NGINX_DEF_CONFIG_NAME}"
  "FRONTEND_NGINX_APP_CONFIG_NAME=${FRONTEND_NGINX_APP_CONFIG_NAME}"
)

require_items_exist secret "${REQUIRED_SECRETS[@]}"
require_items_exist config "${REQUIRED_CONFIGS[@]}"

# 7. Deploy (declare desired state)
log "Deploying stack..."
docker stack deploy -c docker-stack.yml "${STACK}" --with-registry-auth 2>&1 | mask_stack_name
log "Stack declared. Observing convergence..."

# 8. Observe outcome — wait for both services in parallel
# Note: the || clause must NOT appear on the background line — it would run
# inside the subshell, always produce exit 0, and mask failures from the
# parent's `wait` call. Only the `wait` lines in the parent set ok flags.
deploy_ok=true
backend_ok=true
frontend_ok=true

wait_for_service "${BACKEND_SERVICE}" "${DEPLOY_TIMEOUT}" "${MASKED_BACKEND}" &
BACKEND_PID=$!

wait_for_service "${FRONTEND_SERVICE}" "${DEPLOY_TIMEOUT}" "${MASKED_FRONTEND}" &
FRONTEND_PID=$!

wait "${BACKEND_PID}"  || backend_ok=false
wait "${FRONTEND_PID}" || frontend_ok=false

[[ "${backend_ok}" == true && "${frontend_ok}" == true ]] || deploy_ok=false

# 9. Final report & cleanup
log "--- Final Service Status ---"
report_service_status "${BACKEND_SERVICE}"  "${MASKED_BACKEND}"
report_service_status "${FRONTEND_SERVICE}" "${MASKED_FRONTEND}"
log "----------------------------"

if [[ "${deploy_ok}" == true ]]; then
  log "All services converged successfully."

  # 9a. Save a fully-resolved stack artifact for audit trail.
  # docker compose config resolves all ${VAR} placeholders and validates
  # the compose file — producing a self-contained record of what was deployed.
  # COMMIT_SHA is validated as a 40-char hex string before use in a path
  # to prevent path injection via a crafted env value.
  commit_sha="${COMMIT_SHA:-}"
  if [[ -n "${commit_sha}" ]]; then
    if [[ ! "${commit_sha}" =~ ^[0-9a-f]{40}$ ]]; then
      warn "COMMIT_SHA is not a valid 40-char hex SHA — skipping artifact."
    else
      artifact="${DEPLOY_DIR}/artifacts/docker-stack-${commit_sha}.yml"
      if docker compose -f docker-stack.yml config > "${artifact}" 2>/dev/null; then
        log "Artifact saved: ${artifact}"
      else
        warn "Could not render stack artifact — check docker compose config."
      fi
    fi
  fi

  log "Deployment complete."
  exit 0
fi

# -- Deployment failed --
log "--- Failed Task Details ---"
dump_service_tasks "${BACKEND_SERVICE}"  "${MASKED_BACKEND}"
dump_service_tasks "${FRONTEND_SERVICE}" "${MASKED_FRONTEND}"
log "----------------------------"

if [[ "${STACK_WAS_RUNNING}" == true ]]; then
  err "Deployment failed."
  err "Docker Swarm's automatic rollback should have restored the previous version."
  err "Inspect service logs on the host for further details."
  exit 1
fi

# First deploy — clean up orphaned resources
warn "First deploy failed. Removing stack to clean up orphaned resources (networks, etc.)..."
docker stack rm "${STACK}" 2>&1 | mask_stack_name || true

log "Waiting ${STACK_RM_SETTLE_TIME}s for resource cleanup..."
sleep "${STACK_RM_SETTLE_TIME}"

verify_network_cleanup
die "Fresh deployment failed. Stack and orphaned resources removed."