# System Design Architecture - Job Application Tracker

This document explains **how the system is shaped at runtime** (components, trust boundaries, networks, certificates) for **local development** and **production**. For exact commands and step-by-step deployment instructions, see:
- [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)

---

## Local Environment

### Goals (Local)
- Provide a fast developer loop with **hot reload** for both frontend and backend.
- Run a real MongoDB instance in a container.
- Keep networking simple and predictable (browser → Angular dev server → API → MongoDB).

### Architecture

```

    ┌──────────────────────────────────────────────────────────────┐
    │                                                              │
    │                      HOST MACHINE                            │
    │                                                              │
    └───────────┬──────────────────────────────────────────────────┘
                │
                │ Browser HTTP (dev) (/*)
                │
    ┌──────────────────────────┐            ┌────────────────────────┐
    │  Frontend (Angular)      │            │   Backend (Express)    │
    │  Reverse Proxy           │            │                        │
    │  Port: 4200              │            │   Port: 3000           │
    │                          │            │                        │
    │                          │   /api/*   │                        │
    │ * SPA                    │───────────▶│ * REST API             │
    │ * State Management       │            │ * JWT Auth             │
    │ * Chart.js               │            │ * Rate Limiting        │
    │ * Responsive UI          │            │ * Input Validation     │
    └──────────────────────────┘            └───────────┬────────────┘
                                                        │
                                                        │ Mongoose ODM
                                                        ▼
                                            ┌────────────────────────┐
                                            │   MongoDB Database     │
                                            │   Port: 27017          │
                                            │                        │
                                            │ * Users Collection     │
                                            │ * Jobs Collection      │
                                            │ * Indexes & Validation │
                                            └────────────────────────┘
```

### Runtime components (Local)
- **Frontend**: Angular dev server (containerized in the `dev` profile) exposed on `$FRONTEND_PORT` (default `4200`).  
- **Backend**: Node/Express API (containerized in the `dev` profile) exposed on `$HOST_PORT:$SERVER_PORT`.  
- **Database**: MongoDB container (dev profile), internal-only (not published to host by default).

All of this is orchestrated via [docker-compose.yml](docker-compose.yml) using the **`dev`** profile.

### Local setup notes
- You can generate self-signed certs via [nginx/generate-ssl.sh](nginx/generate-ssl.sh). This is mainly relevant for the **production/demo nginx container flow**, not for the Angular dev server itself.  
- Environment configuration is managed through `.env.*` files (see `.env.example`).

---

## Production Environment

### Goals (Production)
- Serve the app behind a **host-level NGINX** that terminates public HTTPS (Let’s Encrypt).
- Run application services in **Docker Swarm** for deployment/rollbacks and easy scaling.
- Use **Docker Secrets/Configs** so credentials and TLS material are not stored in images.
- Use **mTLS** between host NGINX and the *frontend nginx container* for internal trust.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            HETZNER VPS                                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     HOST NGINX (Port 80/443)                      │   │
│  │  * Let's Encrypt certificate (public TLS)                         │   │
│  │  * Terminates public HTTPS                                        │   │
│  │  * mTLS client to frontend container                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              │ mTLS (internal CA-signed)                │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     DOCKER SWARM                                  │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────┐  │   │
│  │  │   FRONTEND (nginx)      │    │      BACKEND (node.js)      │  │   │
│  │  │   Port F_PORT (HTTPS)   │───▶│      Port B_PORT (HTTP)     │  │   │
│  │  │   * Server cert (mTLS)  │    │                             │  │   │
│  │  │   * Verifies client     │    │                             │  │   │
│  │  └─────────────────────────┘    └─────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  Docker Secrets: frontend_crt, frontend_privkey, ssl_ca_crt,      │   │
│  │                  mongodb_url, jwt_secret                           │   │
│  │  Docker Configs: nginx_conf, nginx_frontend_conf                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Trust boundaries and traffic flow (Production)
1. **Browser → Host NGINX**  
   - Public HTTPS using **Let’s Encrypt** certificate.
   - Host NGINX is the only internet-facing entrypoint.

2. **Host NGINX → Frontend container (NGINX) over mTLS**  
   - Host NGINX presents a **client certificate**.
   - Frontend container NGINX presents a **server certificate** signed by an internal CA.
   - This ensures only the trusted host proxy can reach the internal frontend endpoint.

3. **Frontend container → Backend service (HTTP inside the Swarm network)**  
   - Backend is not directly exposed to the internet; it is reachable only via Swarm networking.
   - Auth is still enforced by the API (JWT cookies, rate limiting, validation, etc.).

### Certificate Architecture

| Layer | Certificate Type | Purpose |
|-------|------------------|---------|
| Browser → Host nginx | Let’s Encrypt (public) | Public TLS, trusted by browsers |
| Host nginx → Frontend container | Internal CA-signed (mTLS) | Host presents client cert, container verifies |
| Frontend container | Internal CA-signed (server) | Container presents server cert, host verifies |

**Why two CAs?**
- Let’s Encrypt: internet-trusted, automated renewal, domain validated
- Internal CA: private trust domain, no external dependency, operator-controlled validity

### Swarm configuration model (Secrets + Configs)
Production Swarm deployment (see [docker-stack.yml](docker-stack.yml)) relies on:

**Docker Secrets**
- MongoDB connection string (e.g. `mongodb_url_v<version>`)
- JWT secret (e.g. `jwt_secret_v<version>`)
- mTLS materials for frontend nginx:
  - CA certificate (`ssl_ca_crt_v<version>`)
  - server certificate (`frontend_crt_v<version>`)
  - server private key (`frontend_privkey_v<version>`)

**Docker Configs**
- NGINX base config (e.g. `nginx_conf_v<version>`) from [nginx/nginx.conf](nginx/nginx.conf)
- NGINX site config (e.g. `nginx_frontend_conf_v<version>`) from [nginx/conf.d/app.conf](nginx/conf.d/app.conf)

This versioned naming enables **safe updates and rollbacks** by incrementing versions and redeploying.

### Operational setup summary
The production environment assumes you’ve completed:
- Host NGINX install + firewall rules + Let’s Encrypt issuance
- Internal CA + server/client cert generation (mTLS)
- Docker install + `docker swarm init`
- Creation of Swarm secrets/configs
- Deployment via `docker stack deploy -c docker-stack.yml <stack>`

The detailed, command-by-command procedure lives in:
- [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)