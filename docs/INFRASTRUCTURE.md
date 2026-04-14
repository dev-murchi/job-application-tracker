# Infrastructure & Deployment Architecture (Local and Production)

This document provides step-by-step instructions for setting up all deployment environments. For architectural diagrams and design rationale, see [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

## Table of Contents

1. [Local Development Environment](#local-development-environment)
2. [Local Prod-Demo Environment](#local-prod-demo-environment)
3. [Production Environment Setup](#production-environment-setup)
   - [VPS Prerequisites](#1-vps-prerequisites)
   - [NGINX & SSL Setup](#2-nginx--ssl-setup)
   - [mTLS Certificate Generation](#3-mtls-certificate-generation)
   - [Docker & Swarm Setup](#4-docker--swarm-setup)
   - [Swarm Secrets & Configs](#5-swarm-secrets--configs)
   - [Deploy User Setup](#6-deploy-user-setup)
   - [Application Deployment](#7-application-deployment)
   - [Monitoring & Rollback](#8-monitoring--rollback)
4. [CI/CD Automated Deployment](#cicd-automated-deployment)
   - [Pipeline Steps](#pipeline-steps)
   - [Deployment Artifacts](#deployment-artifacts)
   - [Deploy Wrapper Security](#deploy-wrapper-security)
   - [Required GitHub Secrets](#required-github-secrets)
5. [Secret and Certificate Rotation](#secret-and-certificate-rotation)

---

## Local Development Environment

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- OpenSSL (optional, only needed for prod-demo)
- Vim (optional; you can use any editor you want)

### Setup Steps

1. **Install OpenSSL** (if not already available)

    ```sh
    # Ubuntu/Debian
    sudo apt-get update && sudo apt-get install -y openssl

    # macOS (Homebrew)
    brew install openssl
    ```

2. **Create environment file**

    ```sh
    cp .env.example .env.dev
    ```

3. **Configure environment variables**

    ```sh
    # Edit values: JWT_SECRET, MongoDB credentials, ports, etc.
    vim .env.dev

    # Generate a secure JWT secret
    openssl rand -base64 32
    ```

    At minimum, update these values in `.env.dev`:
    - `JWT_SECRET` — replace with generated secret
    - `MONGO_INITDB_ROOT_USERNAME` — choose a username
    - `MONGO_INITDB_ROOT_PASSWORD` — choose a strong password
    - `MONGO_URL` — update username/password to match above

4. **Start the development environment**

    ```sh
    docker compose --profile dev --env-file .env.dev up --build
    ```

5. **Access the application**

    | Service       | URL                        |
    |---------------|----------------------------|
    | Frontend      | http://localhost:4200       |
    | Backend API   | http://localhost:3000       |
    | Health Check  | http://localhost:3000/health |

6. **Stop the environment**

    ```sh
    # Stop containers (preserves data)
    docker compose --profile dev --env-file .env.dev down

    # Stop and remove volumes (destroys data)
    docker compose --profile dev --env-file .env.dev down -v
    ```

---

## Local Prod-Demo Environment

The prod-demo profile simulates the production setup locally using self-signed certificates and NGINX.

### Setup Steps

1. **Install OpenSSL** (see above)

2. **Generate self-signed certificates** for the frontend NGINX container

    ```sh
    chmod +x ./nginx/generate-ssl.sh
    ./nginx/generate-ssl.sh
    ```

3. **Create environment file**

    ```sh
    cp .env.example .env.prod-demo
    ```

4. **Configure environment variables**

    ```sh
    vim .env.prod-demo

    # Generate a secure JWT secret
    openssl rand -base64 32
    ```

    Update at minimum:
    - `NODE_ENV=production`
    - `JWT_SECRET` — use the generated secret
    - `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`
    - `MONGO_URL` — update credentials and use `mongodb-prod` as the host
    - `CORS_ORIGIN=https://localhost`

5. **Start the prod-demo environment**

    ```sh
    docker compose --profile prod-demo --env-file .env.prod-demo up --build
    ```

6. **Access the application**

    | Service   | URL                    | Notes                              |
    |-----------|------------------------|------------------------------------|
    | Frontend  | https://localhost      | Self-signed cert (browser warning) |
    | Backend   | Proxied via NGINX      | Not directly accessible            |

7. **Stop the environment**

    ```sh
    docker compose --profile prod-demo --env-file .env.prod-demo down -v
    ```

---

## Production Environment Setup

> **Important**: All steps in this section are idempotent — running them multiple times will not cause issues unless explicitly noted.

### Overview

Production deployment uses:
- **Host NGINX** for public HTTPS termination (Let's Encrypt)
- **Docker Swarm** for container orchestration, rolling updates, and rollbacks
- **Docker Secrets/Configs** for secure credential and configuration management
- **mTLS** between host NGINX and the frontend container for internal trust
- **Restricted deploy user** (`ghactions`) for CI/CD access with minimal privileges

### 1. VPS Prerequisites

Ensure you have a VPS (e.g., DigitalOcean, Hetzner) with:
- Ubuntu 22.04+ (or equivalent)
- A domain name pointing to the server's IP
- SSH access configured

### 2. NGINX & SSL Setup

#### Install NGINX

```sh
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### Install Certbot

```sh
sudo apt-get install -y openssl certbot python3-certbot-nginx
```

#### Configure Firewall

```sh
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

#### Obtain Let's Encrypt Certificate

```sh
# Replace example.com with your actual domain
sudo certbot --nginx -d example.com -d www.example.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

#### Configure Host NGINX

Create your site configuration:

```sh
# Create site config (adjust paths and domain as needed)
# Place config in: /etc/nginx/sites-available/<your-site>
# Symlink to: /etc/nginx/sites-enabled/<your-site>

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

The host NGINX should:
- Terminate public HTTPS (Let's Encrypt)
- Forward requests to the frontend container via mTLS
- Use the client certificate to authenticate to the container

### 3. mTLS Certificate Generation

Create certificates for secure communication between host NGINX and the Docker containers.

#### Create SSL Directory

```sh
mkdir -p ~/mtls && cd ~/mtls
```

#### Generate CA (Certificate Authority)

```sh
# Generate CA private key
openssl genrsa -out ca.key 4096

# Generate CA certificate
openssl req -new -x509 -days 365 -key ca.key \
    -out ca.crt \
    -subj "/C=US/ST=State/L=City/O=JobTracker/CN=JobTracker CA"
```

#### Generate Server Certificate (Frontend Container)

```sh
# Set your domain
export DOMAIN="example.com"

# Generate server private key
openssl genrsa -out frontend.key 2048

# Create CSR
openssl req -new -key frontend.key \
    -out frontend.csr \
    -subj "/C=US/ST=State/L=City/O=JobTracker/CN=$DOMAIN"

# Create SAN extension file
cat > frontend_ext.cnf <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = frontend
DNS.4 = *.${DOMAIN}
IP.1 = 127.0.0.1
EOF

# Sign server certificate
openssl x509 -req -in frontend.csr \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out frontend.crt -days 365 -sha256 \
    -extfile frontend_ext.cnf
```

#### Generate Client Certificate (Host NGINX)

```sh
# Generate client private key
openssl genrsa -out host-client.key 2048

# Create CSR
openssl req -new -key host-client.key \
    -out host-client.csr \
    -subj "/C=US/ST=State/L=City/O=JobTracker/CN=host-nginx-client"

# Create extension file
cat > client_ext.cnf <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
EOF

# Sign client certificate
openssl x509 -req -in host-client.csr \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out host-client.crt -days 365 -sha256 \
    -extfile client_ext.cnf
```

#### Set Permissions and Clean Up

```sh
chmod 600 *.key
chmod 644 *.crt
rm -f *.csr *.cnf *.srl

echo "=== SSL Certificates Created ==="
echo "CA Certificate:     ~/mtls/ca.crt"
echo "Server Certificate: ~/mtls/frontend.crt"
echo "Server Key:         ~/mtls/frontend.key"
echo "Client Certificate: ~/mtls/host-client.crt"
echo "Client Key:         ~/mtls/host-client.key"
ls -la ~/mtls/
```

### 4. Docker & Swarm Setup

#### Install Docker

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

# Re-login or run: newgrp docker
docker version
docker compose version
```

#### Initialize Docker Swarm

```sh
docker swarm init
docker node ls
```

### 5. Swarm Secrets & Configs

Docker Swarm uses versioned secrets and configs for safe updates and rollbacks. Version numbers must match the names referenced in `docker-stack.yml` and your `.env` file.

#### Create Secrets

```sh
# Set versions (increment when rotating)
export APP_SECRET_VERSION=1
export CERT_VERSION=1

# Application secrets
echo -n 'mongodb://USER:PASS@mongodb-prod:27017/jobs-tracker?authSource=admin' \
  | docker secret create "mongodb_url_v${APP_SECRET_VERSION}" -

echo -n 'YOUR_SECURE_JWT_SECRET_HERE' \
  | docker secret create "jwt_secret_v${APP_SECRET_VERSION}" -

# TLS secrets (from ~/mtls)
docker secret create "ssl_ca_crt_v${CERT_VERSION}"      ~/mtls/ca.crt
docker secret create "frontend_crt_v${CERT_VERSION}"     ~/mtls/frontend.crt
docker secret create "frontend_privkey_v${CERT_VERSION}" ~/mtls/frontend.key

# Verify
docker secret ls
```

#### Create Configs

```sh
export CONFIG_VERSION=1

# NGINX configs (from the repository)
docker config create "nginx_conf_v${CONFIG_VERSION}"          ./nginx/nginx.conf
docker config create "nginx_frontend_conf_v${CONFIG_VERSION}" ./nginx/conf.d/app.conf

# Verify
docker config ls
```

### 6. Deploy User Setup

Create a dedicated user with minimal privileges for CI/CD deployments.

#### Create the user

```sh
sudo adduser --disabled-password --gecos "GitHub Actions Deploy" ghactions
```

#### Generate SSH keypair (on your local machine)

```sh
ssh-keygen -t ed25519 -C "ghactions-deploy" -f ~/.ssh/ghactions_deploy -N ""
```

This creates:
- `~/.ssh/ghactions_deploy` — **private key** → store as `VPS_SSH_KEY` GitHub Secret
- `~/.ssh/ghactions_deploy.pub` — **public key** → install on VPS

#### Install the public key (on VPS)

```sh
# Copy the public key to clipboard (on your local machine)
# macOS: cat ~/.ssh/ghactions_deploy.pub | pbcopy
# Linux: cat ~/.ssh/ghactions_deploy.pub | xclip -selection clipboard

sudo mkdir -p /home/ghactions/.ssh
sudo touch /home/ghactions/.ssh/authorized_keys
sudo chmod 700 /home/ghactions/.ssh
sudo chmod 600 /home/ghactions/.ssh/authorized_keys
sudo chown -R ghactions:ghactions /home/ghactions/.ssh

# Paste the public key (replace the placeholder)
echo "ssh-ed25519 AAAA...your-key... ghactions-deploy" \
  | sudo tee -a /home/ghactions/.ssh/authorized_keys
```

#### Add to Docker group

```sh
sudo usermod -aG docker ghactions
```

#### Create the deploy directory

```sh
# Root owns the base directory — ghactions cannot delete the wrapper
sudo mkdir -p /opt/deploy/workspace /opt/deploy/artifacts

sudo chown root:ghactions /opt/deploy
sudo chmod 750 /opt/deploy

# ghactions owns workspace — SCP/SFTP write target for CI/CD file uploads
sudo chown ghactions:ghactions /opt/deploy/workspace
sudo chmod 700 /opt/deploy/workspace

# ghactions owns artifacts — deploy.sh writes here directly (no sudo).
# Mode 700: only ghactions can read/write; root owns the parent directory
# so ghactions cannot delete the artifacts directory itself.
# SCP access is blocked by wrapper path validation.
# SFTP access is mitigated by: protocol-level readdir/opendir denial
# (client cannot enumerate the directory) and SHA-based filenames
# (40-char hex makes path guessing infeasible).
sudo chown ghactions:ghactions /opt/deploy/artifacts
sudo chmod 700 /opt/deploy/artifacts
```

#### Install the deployment scripts

Both `deploy-wrapper.sh` and `deploy.sh` are reference files provided in [`infra-demo/`](../infra-demo/). They are installed **once manually** on the VPS and are **never copied or modified by CI/CD**.

```sh
# Copy both scripts from the infra-demo/ reference directory to the server
sudo cp infra-demo/deploy-wrapper.sh /opt/deploy/deploy-wrapper.sh
sudo chown root:root /opt/deploy/deploy-wrapper.sh
sudo chmod 755 /opt/deploy/deploy-wrapper.sh

sudo cp infra-demo/deploy.sh /opt/deploy/deploy.sh
sudo chown root:root /opt/deploy/deploy.sh
sudo chmod 755 /opt/deploy/deploy.sh
```

> **Important**: Both scripts are owned by **root** — `ghactions` cannot modify or delete them. Update them on the VPS by repeating the `sudo cp` commands above whenever the reference files in `infra-demo/` change.

#### Directory structure

```
/opt/deploy/                     root:ghactions     750
├── deploy-wrapper.sh            root:root          755  ← immutable; ForceCommand target
├── deploy.sh                    root:root          755  ← immutable; pre-installed once from infra-demo/
├── workspace/                   ghactions:ghactions 700  ← SCP/SFTP target, cleaned after deploy
│   ├── docker-stack.yml         (temporary — uploaded by CI/CD each run)
│   └── .deploy.env              (temporary — uploaded by CI/CD each run)
└── artifacts/                   ghactions:ghactions 700  ← written by deploy.sh; not accessible via SCP
    ├── docker-stack-abc123.yml  (permanent — resolved stack snapshot per deployment)
    └── docker-stack-def456.yml
```

> **Why `ghactions` owns `artifacts/`**: `deploy.sh` writes resolved stack snapshots
> to `artifacts/` directly as the `ghactions` user (no `sudo`). Linux filesystem
> permissions cannot distinguish a process spawned by `deploy.sh` from one spawned
> by `sftp-server` — both run as `ghactions`. SCP access is blocked by the wrapper's
> path validation. SFTP residual risk is mitigated by protocol-level `readdir`/`opendir`
> denial (client cannot enumerate `artifacts/`) and SHA-based filenames that make
> path guessing computationally infeasible.

#### Harden SSH for the deploy user

```sh
sudo tee -a /etc/ssh/sshd_config <<'EOF'

# --- GitHub Actions deploy user restrictions ---
Match User ghactions
    PasswordAuthentication no
    PubkeyAuthentication yes
    PermitEmptyPasswords no
    X11Forwarding no
    AllowTcpForwarding no
    AllowAgentForwarding no
    PermitTunnel no
    Subsystem sftp internal-sftp
    ForceCommand /opt/deploy/deploy-wrapper.sh
EOF

sudo sshd -t && sudo systemctl reload sshd
```

#### Verify (from your local machine)

```sh
# Test that ForceCommand intercepts — arbitrary commands are rejected
ssh -i ~/.ssh/ghactions_deploy -p <SSH_PORT> ghactions@<VPS_IP> "whoami"
# Expected: [WRAPPER] ERROR: Unknown command.

# Test SCP to allowed directory
echo "test" > /tmp/test-scp.txt
scp -i ~/.ssh/ghactions_deploy -P <SSH_PORT> /tmp/test-scp.txt ghactions@<VPS_IP>:/opt/deploy/workspace/test-scp.txt
# Expected: success

# Test SCP to disallowed directory
scp -i ~/.ssh/ghactions_deploy -P <SSH_PORT> /tmp/test-scp.txt ghactions@<VPS_IP>:/etc/test-scp.txt
# Expected: [WRAPPER] ERROR: SCP target outside allowed directory.

# Clean up test file
rm /tmp/test-scp.txt
```

> For the full SCP/SFTP security test suite (legacy mode, modern SFTP protocol, path traversal, overwrite prevention, etc.) see [INFRA_SECURITY_TESTS.md](INFRA_SECURITY_TESTS.md).

#### Deploy user permission summary

| Capability                        | Allowed | Reason                              |
|-----------------------------------|---------|-------------------------------------|
| SSH key login                     | ✅       | Public key in `authorized_keys`     |
| Password login                    | ❌       | `--disabled-password` + sshd config |
| Run Docker commands               | ✅       | Member of `docker` group            |
| Run `sudo`                        | ❌       | Not in `sudo` group                 |
| Execute `deploy.sh` via wrapper   | ✅       | `ForceCommand` runs the wrapper     |
| SCP to `/opt/deploy/workspace/`   | ✅       | Wrapper allows SCP to workspace     |
| SCP outside workspace             | ❌       | Wrapper path validation rejects     |
| SCP to `/opt/deploy/artifacts/`   | ❌       | Wrapper path validation rejects     |
| SFTP write to workspace           | ✅       | Permitted via SFTP protocol allow-list |
| SFTP read/list/delete workspace   | ❌       | Denied via sftp-server `-P` flag    |
| SFTP enumerate `artifacts/`       | ❌       | `readdir`/`opendir` denied          |
| Write `artifacts/` (deploy.sh)    | ✅       | `ghactions` owns dir (700); no sudo needed |
| Overwrite existing file (SCP/SFTP)| ❌       | Wrapper chmod 400s files before exec |
| Run arbitrary commands            | ❌       | `ForceCommand` intercepts all SSH   |
| Modify `deploy-wrapper.sh`        | ❌       | Owned by `root:root`                |
| Delete `deploy-wrapper.sh`        | ❌       | Parent dir owned by `root:ghactions`|
| SSH port forwarding / tunneling   | ❌       | Disabled in sshd `Match` block      |
| X11 / agent forwarding            | ❌       | Disabled in sshd `Match` block      |

### 7. Application Deployment

#### Login to Container Registry

```sh
echo "$REGISTRY_PASSWORD" | docker login ghcr.io -u "$REGISTRY_USER" --password-stdin
```

#### Set Environment Variables

```sh
# Required by docker-stack.yml
export SERVER_PORT=3000
export JWT_LIFETIME=7d
export CORS_ORIGIN=https://example.com
export RATE_LIMIT_WINDOW_MS=900000
export RATE_LIMIT_MAX_REQUESTS=100
export LOG_LEVEL=info
export REQUEST_SIZE_LIMIT=100kb

# Secret and config names (must match versions created above)
export JWT_SECRET_NAME="jwt_secret_v1"
export MONGO_URL_SECRET_NAME="mongodb_url_v1"
export FRONTEND_SSL_CRT_SECRET_NAME="frontend_crt_v1"
export FRONTEND_SSL_PRIVKEY_SECRET_NAME="frontend_privkey_v1"
export SSL_CA_CRT_SECRET_NAME="ssl_ca_crt_v1"
export FRONTEND_NGINX_DEF_CONFIG_NAME="nginx_conf_v1"
export FRONTEND_NGINX_APP_CONFIG_NAME="nginx_frontend_conf_v1"

export NGINX_HTTPS_PORT=443
export NGINX_HTTP_PORT=80

# Container images
export BACKEND_IMAGE=ghcr.io/<org>/<repo>-backend:<tag>@sha256:<digest>
export FRONTEND_IMAGE=ghcr.io/<org>/<repo>-frontend:<tag>@sha256:<digest>
```

#### Deploy the Stack

```sh
export STACK_NAME=jobs-tracker

docker stack deploy -c docker-stack.yml "${STACK_NAME}" --with-registry-auth

# Verify deployment
docker stack services "${STACK_NAME}"
docker stack ps "${STACK_NAME}"
```

### 8. Monitoring & Rollback

#### Monitor Services

```sh
# List all services
docker service ls

# Check service tasks
docker service ps "${STACK_NAME}_backend"
docker service ps "${STACK_NAME}_frontend"

# View logs
docker service logs -f "${STACK_NAME}_backend"
docker service logs -f "${STACK_NAME}_frontend"
```

#### Rollback on Failure

Docker Swarm automatically rolls back failed updates (configured via `update_config` / `rollback_config` in `docker-stack.yml`). To manually rollback:

```sh
# Rollback individual services
docker service update --rollback "${STACK_NAME}_backend"
docker service update --rollback "${STACK_NAME}_frontend"

# Or remove the entire stack (use with caution)
docker stack rm "${STACK_NAME}"
```

---

## CI/CD Automated Deployment

The production deployment is automated via the [Swarm Deploy workflow](../.github/workflows/swarm-deploy.yml).

### Pipeline Steps

1. **Validate inputs** — checks image references are `image:tag@sha256:<64-hex>` or `CURRENT`
2. **Checkout** — clones the repository
3. **Setup SSH** — installs the deploy key and configures the SSH alias
4. **Copy files** — SCPs `docker-stack.yml` to `/opt/deploy/workspace/` (`deploy.sh` is pre-installed on the VPS and not uploaded by CI/CD)
5. **Upload env file** — builds `.deploy.env` from GitHub Secrets and SCPs it to `/opt/deploy/workspace/`
6. **Execute deploy** — runs `ssh deploy-target deploy`
   - SSH `ForceCommand` intercepts and runs `/opt/deploy/deploy-wrapper.sh`
   - The wrapper sources `.deploy.env`, executes the pre-installed `/opt/deploy/deploy.sh`, creates an artifact on success, and cleans up `workspace/`
7. **Cleanup SSH** — removes the deploy key from the runner (always, even on failure)

### Concurrency

`concurrency.group: swarm-deploy` with `cancel-in-progress: false` ensures only one deploy runs at a time. Subsequent deploys queue — they never cancel an in-flight deployment.

### Deployment Artifacts

On successful deployment, the wrapper creates a rendered stack file:

```
/opt/deploy/artifacts/docker-stack-<commit-sha>.yml
```

This file is produced by `docker compose -f docker-stack.yml config`, which:
- Resolves all `${VAR}` placeholders to their actual values
- Validates the Compose/Stack file structure
- Outputs a fully rendered, deployable YAML

These artifacts serve as an audit trail — you can see exactly what was deployed for any commit.

### Deploy Wrapper Security

Both `deploy-wrapper.sh` and `deploy.sh` are reference files in [`infra-demo/`](../infra-demo/). They are installed **once manually** on the VPS and are **never touched by CI/CD**. The wrapper is at `/opt/deploy/deploy-wrapper.sh`; the deploy script is at `/opt/deploy/deploy.sh`.

- **Owned by `root:root`** — `ghactions` cannot modify or delete either file
- **Parent directory owned by `root:ghactions`** — `ghactions` cannot delete them via directory write
- **`ForceCommand`** ensures every SSH session runs the wrapper instead of arbitrary commands
- **SCP is allowed** only to `/opt/deploy/workspace/`
- **Only the `deploy` command** is accepted — all other commands are rejected
- **Shell metacharacters** are blocked in arguments
- **Temporary files** in `workspace/` (`docker-stack.yml`, `.deploy.env`) are always cleaned up after deploy

### Required GitHub Secrets

All values are stored as **GitHub Secrets** for automatic masking in logs:

| Secret | Purpose | Example |
|---|---|---|
| `VPS_SSH_HOST` | VPS IP or hostname | `203.0.113.10` |
| `VPS_SSH_USER` | SSH username | `ghactions` |
| `VPS_SSH_KEY` | SSH private key (ed25519) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_SSH_PORT` | SSH port | `22` |
| `STACK_NAME` | Docker Swarm stack name | `jobs-tracker` |
| `CR_PAT` | GitHub Container Registry PAT | `ghp_xxxx...` |
| `CR_USERNAME` | GHCR username | `github-username` |
| `DEPLOY_DIR` | Remote deploy directory | `/opt/deploy` |
| `SERVER_PORT` | Backend HTTP port | `3000` |
| `JWT_LIFETIME` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://example.com` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Application log level | `info` |
| `REQUEST_SIZE_LIMIT` | Max request body size | `100kb` |
| `JWT_SECRET_NAME` | Docker secret name for JWT | `jwt_secret_v1` |
| `MONGO_URL_SECRET_NAME` | Docker secret name for MongoDB URL | `mongodb_url_v1` |
| `FRONTEND_SSL_CRT_SECRET_NAME` | Docker secret name for SSL cert | `frontend_crt_v1` |
| `FRONTEND_SSL_PRIVKEY_SECRET_NAME` | Docker secret name for SSL key | `frontend_privkey_v1` |
| `SSL_CA_CRT_SECRET_NAME` | Docker secret name for CA cert | `ssl_ca_crt_v1` |
| `NGINX_HTTP_PORT` | NGINX HTTP port | `80` |
| `NGINX_HTTPS_PORT` | NGINX HTTPS port | `443` |
| `FRONTEND_NGINX_DEF_CONFIG_NAME` | Docker config name for nginx.conf | `nginx_conf_v1` |
| `FRONTEND_NGINX_APP_CONFIG_NAME` | Docker config name for app.conf | `nginx_frontend_conf_v1` |

---

## Secret and Certificate Rotation

### Rotating Application Secrets (JWT / MongoDB URL)

1. Increment the version number
2. Create the new secret:
   ```sh
   echo -n 'NEW_SECRET_VALUE' | docker secret create "jwt_secret_v2" -
   ```
3. Update the `JWT_SECRET_NAME` GitHub Secret to `jwt_secret_v2`
4. Redeploy the stack — the old secret remains available for rollback

### Rotating mTLS Certificates

1. Generate new certificates (follow [mTLS Certificate Generation](#3-mtls-certificate-generation))
2. Increment `CERT_VERSION`
3. Create new secrets:
   ```sh
   docker secret create "ssl_ca_crt_v2"      ~/mtls/ca.crt
   docker secret create "frontend_crt_v2"     ~/mtls/frontend.crt
   docker secret create "frontend_privkey_v2" ~/mtls/frontend.key
   ```
4. Update the corresponding GitHub Secrets
5. Redeploy the stack

### Rotating the Deploy SSH Key

1. Generate a new keypair:
   ```sh
   ssh-keygen -t ed25519 -C "ghactions-deploy-v2" -f ~/.ssh/ghactions_deploy_v2 -N ""
   ```
2. Add the new public key to `authorized_keys` on the VPS:
   ```sh
   cat ~/.ssh/ghactions_deploy_v2.pub | sudo tee -a /home/ghactions/.ssh/authorized_keys
   ```
3. Update `VPS_SSH_KEY` GitHub Secret with the new private key
4. Verify the new key works, then remove the old public key from `authorized_keys`

### Rotating Let's Encrypt Certificates

Handled automatically by certbot's cron job. To manually renew:

```sh
sudo certbot renew
sudo systemctl reload nginx
```