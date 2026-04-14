# Manual Test Commands

Exact copy-paste commands for every test case.

**Connection details** (expand these shorthands used throughout):
```
HOST  = 
PORT  = 
USER  = 
KEY   = 
WS    = 
```

> **Re-run note:** Tests that upload files leave them on the VPS as `chmod 400`.  
> Before re-running upload tests, clean the workspace (see the Cleanup section at the bottom).

---

## Legacy SCP — Permitted (upload tests)

### scp_sink_mode_workspace_dir_allowed
Upload to the workspace directory itself — wrapper should accept.
```bash
echo 'test: routing' > /tmp/test-routing.txt
scp -O \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-routing.txt \
  se-miamigo:/opt/deploy/workspace/
```
**Expected:** exit 0

---

### scp_sink_mode_direct_child_allowed
Upload to an explicit filename — wrapper should accept.
```bash
echo 'test: routing' > /tmp/test-direct.txt
scp -O \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-direct.txt \
  se-miamigo:/opt/deploy/workspace/test-direct.txt
```
**Expected:** exit 0

---

### scp_verbose_flag_allowed
`-v` is a client-side flag; wrapper must pass it through.
```bash
echo 'test: routing' > /tmp/test-verbose.txt
scp -v -O \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-verbose.txt \
  se-miamigo:/opt/deploy/workspace/test-verbose.txt
```
**Expected:** exit 0

---

### scp_directory_flag_allowed
`-d` tells scp to treat the target as a directory — wrapper must pass it through.
```bash
echo 'test: routing' > /tmp/test-dirmode.txt
scp -d -O \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-dirmode.txt \
  se-miamigo:/opt/deploy/workspace/
```
**Expected:** exit 0

---

## Legacy SCP — Blocked

> These tests send a raw SSH command string directly.  
> The wrapper intercepts it and must reject it with a non-zero exit.

### scp_source_mode_denied
`-f` is source (read) mode — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -f /opt/deploy/workspace/file.yml'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP source (read) mode is not permitted.`

---

### scp_recursive_lowercase_denied
`-r` recursive — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -r -t /opt/deploy/workspace'
```
**Expected:** exit non-zero  
**Expected stderr:** `Recursive SCP is not permitted.`

---

### scp_recursive_uppercase_denied
`-R` recursive (uppercase) — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -R -t /opt/deploy/workspace'
```
**Expected:** exit non-zero  
**Expected stderr:** `Recursive SCP is not permitted.`

---

### scp_unknown_flag_denied
Unknown flag `-z` — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -z -t /opt/deploy/workspace'
```
**Expected:** exit non-zero  
**Expected stderr:** `Unrecognised SCP flag: -z`

---

### scp_missing_sink_flag_denied
No `-t` flag — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp /opt/deploy/workspace/file.yml'
```
**Expected:** exit non-zero  
**Expected stderr:** `Only SCP sink mode (-t) is permitted.`

---

### scp_no_target_denied
`-t` present but no target path — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t'
```
**Expected:** exit non-zero  
**Expected stderr:** `No SCP target path provided.`

---

### scp_target_outside_workspace_denied
Target is `/etc/passwd` — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t /etc/passwd'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP target outside allowed directory.`

---

### scp_path_traversal_denied
Path traversal attempt via `..` — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t /opt/deploy/workspace/../../../etc/passwd'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP target outside allowed directory.`

---

### scp_nested_subdirectory_denied
Target is a nested path inside workspace — must be blocked.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t /opt/deploy/workspace/subdir/file.yml'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP target must be a direct child of workspace, not a subdirectory.`

---

### scp_source_flag_after_sink_flag_denied
`-f` after `-t` — `-f` must still be caught.
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t -f /opt/deploy/workspace/file.yml'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP source (read) mode is not permitted.`

---

### scp_binary_missing_denied
**SKIP** — cannot remove `/usr/bin/scp` from the VPS to simulate this.

---

### scp_named_file_overwrite_denied
Upload a file, then try to upload to the same path again — second attempt must be blocked.

**Step 1** — initial upload (must succeed):
```bash
echo 'original content' > /tmp/overwrite-legacy.txt
scp -O \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/overwrite-legacy.txt \
  se-miamigo:/opt/deploy/workspace/deploy-test-overwrite-legacy.yml
```
**Expected:** exit 0

**Step 2** — overwrite attempt (must fail):
```bash
ssh -n \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  se-miamigo \
  'scp -t /opt/deploy/workspace/deploy-test-overwrite-legacy.yml'
```
**Expected:** exit non-zero  
**Expected stderr:** `SCP target already exists. Overwriting files is not permitted.`

---

## Modern SCP — Permitted (upload tests)

> No `-O` flag — OpenSSH >= 9.0 uses SFTP internally.

### scp_modern_workspace_dir_allowed
```bash
echo 'test: routing' > /tmp/test-modern-dir.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-modern-dir.txt \
  se-miamigo:/opt/deploy/workspace/
```
**Expected:** exit 0

---

### scp_modern_direct_child_allowed
```bash
echo 'test: routing' > /tmp/test-modern-child.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-modern-child.txt \
  se-miamigo:/opt/deploy/workspace/test-modern-child.txt
```
**Expected:** exit 0

---

### scp_modern_verbose_flag_allowed
```bash
echo 'test: routing' > /tmp/test-modern-verbose.txt
scp -v \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-modern-verbose.txt \
  se-miamigo:/opt/deploy/workspace/test-modern-verbose.txt
```
**Expected:** exit 0

---

### scp_modern_directory_flag_allowed
```bash
echo 'test: routing' > /tmp/test-modern-dmode.txt
scp -d \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-modern-dmode.txt \
  se-miamigo:/opt/deploy/workspace/
```
**Expected:** exit 0

---

## Modern SCP — SFTP Protocol Blocked

> These use the `sftp` client in batch mode (`-b -`) to send specific SFTP protocol operations.

### sftp_read_denied
`get` sends SSH_FXP_READ — must be denied.
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
get /opt/deploy/workspace/docker-stack.yml /tmp/stolen-file
EOF
```
**Expected:** exit non-zero

---

### sftp_readdir_denied
`ls` sends SSH_FXP_OPENDIR + SSH_FXP_READDIR — must be denied.
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
ls /opt/deploy/workspace
EOF
```
**Expected:** exit non-zero

---

### sftp_remove_denied
First upload a file, then try to delete it — `rm` must be denied.

**Step 1** — upload:
```bash
echo 'test: remove-denied' > /tmp/test-sftp-remove.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-sftp-remove.txt \
  se-miamigo:/opt/deploy/workspace/test-sftp-remove.txt
```
**Expected:** exit 0

**Step 2** — delete attempt:
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
rm /opt/deploy/workspace/test-sftp-remove.txt
EOF
```
**Expected:** exit non-zero

---

### sftp_rename_denied
First upload a file, then try to rename it — `rename` must be denied.

**Step 1** — upload:
```bash
echo 'test: rename-denied' > /tmp/test-sftp-rename.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/test-sftp-rename.txt \
  se-miamigo:/opt/deploy/workspace/test-sftp-rename.txt
```
**Expected:** exit 0

**Step 2** — rename attempt:
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
rename /opt/deploy/workspace/test-sftp-rename.txt /opt/deploy/workspace/renamed.txt
EOF
```
**Expected:** exit non-zero

---

### sftp_mkdir_denied
`mkdir` must be denied.
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
mkdir /opt/deploy/workspace/evil-subdir
EOF
```
**Expected:** exit non-zero

---

### sftp_symlink_denied
`symlink` must be denied.
```bash
sftp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -b - \
  se-miamigo <<'EOF'
symlink /etc/passwd /opt/deploy/workspace/passwd-link
EOF
```
**Expected:** exit non-zero

---

### sftp_overwrite_existing_file_denied
Upload a file, then try to upload to the same path — second attempt must be denied.

**Step 1** — initial upload (must succeed):
```bash
echo 'original content' > /tmp/overwrite-modern.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/overwrite-modern.txt \
  se-miamigo:/opt/deploy/workspace/deploy-test-overwrite-modern.yml
```
**Expected:** exit 0

**Step 2** — overwrite attempt (must fail):
```bash
echo 'overwritten content' > /tmp/overwrite-modern.txt
scp \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  /tmp/overwrite-modern.txt \
  se-miamigo:/opt/deploy/workspace/deploy-test-overwrite-modern.yml
```
**Expected:** exit non-zero  
**Expected stderr:** `Permission denied`

---

## Deploy command tests

All 15 tests are **SKIP** — `deploy.sh` has not been deployed to the VPS yet.

---

## Workspace cleanup

Run these via root/admin (not `miamigo-gha`) to remove files left by upload tests:

```bash
# Remove all test files
sudo rm -f /opt/deploy/workspace/test-routing.txt
sudo rm -f /opt/deploy/workspace/test-direct.txt
sudo rm -f /opt/deploy/workspace/test-verbose.txt
sudo rm -f /opt/deploy/workspace/test-dirmode.txt
sudo rm -f /opt/deploy/workspace/deploy-test-overwrite-legacy.yml
sudo rm -f /opt/deploy/workspace/test-modern-dir.txt
sudo rm -f /opt/deploy/workspace/test-modern-child.txt
sudo rm -f /opt/deploy/workspace/test-modern-verbose.txt
sudo rm -f /opt/deploy/workspace/test-modern-dmode.txt
sudo rm -f /opt/deploy/workspace/test-sftp-remove.txt
sudo rm -f /opt/deploy/workspace/test-sftp-rename.txt
sudo rm -f /opt/deploy/workspace/deploy-test-overwrite-modern.yml

# Or nuke everything at once:
sudo find /opt/deploy/workspace -maxdepth 1 -type f -delete

# Verify
sudo ls -la /opt/deploy/workspace/
```
