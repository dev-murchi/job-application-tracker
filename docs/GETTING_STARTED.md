# Getting Started

This guide will help you set up and run the Job Application Tracker on your local machine.

## Prerequisites

### Required Software

- **Docker**: Version 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ ([Install Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository

### Optional (for local development without Docker)

- Node.js 20.x
- MongoDB 8.0
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dev-murchi/job-application-tracker.git
cd job-application-tracker
```

### 2. Configure Environment

Create environment files from the example:

```bash
# For development
cp .env.example .env.dev

# For testing
cp .env.example .env.test

# For production
cp .env.example .env.prod
```

**Critical: Update these values in your `.env` files:**

```bash
# Generate a secure JWT secret (minimum 32 characters)
JWT_SECRET=$(openssl rand -base64 32)

# Set strong MongoDB credentials
MONGO_INITDB_ROOT_USERNAME=your_secure_username
MONGO_INITDB_ROOT_PASSWORD=your_secure_password

# Update MongoDB connection string (for development)
MONGO_URL=mongodb://your_secure_username:your_secure_password@mongodb-dev:27017/jobs-tracker?authSource=admin

# Update MongoDB connection string (for testing)
MONGO_URL=mongodb://your_secure_username:your_secure_password@mongodb-test:27017/jobs-tracker?authSource=admin

# Update MongoDB connection string (for production)
MONGO_URL=mongodb://your_secure_username:your_secure_password@mongodb-prod:27017/jobs-tracker?authSource=admin
```

### 3. Start Development Environment

```bash
docker compose --profile dev --env-file .env.dev up
```

**Access Points:**
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3003
- **Health Check**: http://localhost:3003/health

The application will automatically reload when you make changes to the source code.

### 4. Create Your First User

Open http://localhost:4200 in your browser and:

1. Click "Register" 
2. Fill in your name, email, password and location
3. Click "Create Account"
4. You'll be redirected to the login
5. Fill in your email, and password
6. Click "Login"

### 5. Stop the Application

```bash
# Stop containers
docker compose --profile dev --env-file .env.dev stop

# Remove containers (keeps data)
docker compose --profile dev --env-file .env.dev down

# Remove containers with their data
docker compose --profile dev --env-file .env.dev down -v
```

## Development Workflow

### Running Tests

#### Backend Tests

```bash
# Start test environment
docker compose --profile backend-test --env-file .env.test up -d

# Run all tests
docker exec -it <backend-container-name> npm run test

# Run only unit tests
docker exec -it <backend-container-name> npm run test:unit

# Run only integration tests
docker exec -it <backend-container-name> npm run test:integration

# Cleanup
docker compose --profile backend-test --env-file .env.test down -v
```

#### Frontend Tests

```bash
# Start test environment
docker compose --profile frontend-test --env-file .env.test up -d

# Run tests
docker exec -it <frontend-container-name> npm run test

# Cleanup
docker compose --profile frontend-test --env-file .env.test down -v
```

### Code Linting

```bash
# Backend linting
docker exec -it <backend-container-name> npm run lint

# Frontend linting
docker exec -it <frontend-container-name> npm run lint
```

### Code Formatting

```bash
# Backend formatting
docker exec -it <backend-container-name> npm run format:check
docker exec -it <backend-container-name> npm run format

# Frontend formatting
docker exec -it <frontend-container-name> npm run format
```

### Viewing Logs

```bash
# View all logs
docker compose --profile dev logs -f

# View specific service logs
docker compose --profile dev --env-file .env.dev logs -f backend-dev
docker compose --profile dev --env-file .env.dev logs -f frontend-dev
docker compose --profile dev --env-file .env.dev logs -f mongodb-dev

# View last 100 lines
docker compose --profile dev --env-file .env.dev logs --tail=100 backend-dev
```
