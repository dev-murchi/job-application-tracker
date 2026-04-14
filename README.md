# Job Application Tracker

A production-ready, containerized full-stack application for tracking and managing personal job applications with enterprise-grade architecture, security, and deployment efficiency.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-20.2-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen.svg)](https://www.mongodb.com/)


## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)
- [Acknowledgments](#acknowledgments)

<a id="overview"></a>
## 🎯 Overview

This application is a containerized full-stack implementation of the [Jobs API](https://github.com/dev-murchi/NodeJS-Express-Projects/tree/main/jobs-api/final) project. It provides a robust platform for tracking and managing job applications with enhanced scalability and deployment efficiency.

**Key Highlights:**
- **Production-Grade Architecture:** Dependency injection, factory patterns, and clean separation of concerns
- **Comprehensive Testing:** Full unit and integration test suites with >90% code coverage
- **Enterprise Security:** JWT authentication, rate limiting, input sanitization, and helmet protection
- **Multi-Environment Deployment:** Docker Compose profiles for dev, test, and prod-demo with NGINX reverse proxy

<a id="features"></a>
## ✨ Features

### User Management & Authentication
- Secure user registration and login with bcrypt password hashing
- JWT-based authentication with HTTP-only cookie storage
- Session management with configurable token expiration
- User profile updates with email/name modification

### Job Application Tracking
- Full CRUD operations for job applications
- Track job status (pending, interview, declined, offer)
- Store company, position, and application metadata
- Filter and search capabilities
- User-specific job isolation with permission checks

### Security & Performance
- Rate limiting (100 requests per 15 minutes by default)
- Request sanitization (XSS, NoSQL injection protection)
- Helmet security headers
- CORS configuration
- MongoDB input sanitization
- Structured logging with Winston

### Developer Experience
- Hot-reload development environment
- Comprehensive test suites (unit + integration)
- ESLint + Prettier code formatting
- Docker Compose multi-environment setup
- Health check endpoints for monitoring

<a id="technology-stack"></a>
## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Angular](https://angular.io/) | 20.2.0 | Modern component-based framework with TypeScript |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type-safe application development |
| [TailwindCSS](https://tailwindcss.com/) | 4.1.13 | Utility-first CSS framework |
| [Chart.js](https://www.chartjs.org/) | 4.5.0 | Data visualization for job statistics |
| [RxJS](https://rxjs.dev/) | 7.8.0 | Reactive programming for state management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Node.js](https://nodejs.org/) | 22.x | Server runtime environment |
| [Express.js](https://expressjs.com/) | 4.18.2 | Web application framework |
| [Mongoose](https://mongoosejs.com/) | 8.18.0 | MongoDB ODM with schema validation |
| [Zod](https://zod.dev/) | 4.1.12 | Runtime schema validation |
| [Winston](https://github.com/winstonjs/winston) | 3.18.3 | Structured logging framework |
| [JWT](https://jwt.io/) | 9.0.2 | Token-based authentication |
| [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 3.0.2 | Password hashing |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| [Docker](https://www.docker.com/) | 24.0+ | Application containerization |
| [Docker Compose](https://docs.docker.com/compose/) | 2.20+ | Multi-container orchestration |
| [NGINX](https://www.nginx.com/) | 1.25+ | Reverse proxy and SSL termination |
| [MongoDB](https://www.mongodb.com/) | 8.0 | NoSQL database with replica set support |

### Security & Middleware
- **Helmet**: Security headers (CSP, X-Frame-Options, etc.)
- **CORS**: Cross-origin request handling with credential support
- **Express Rate Limit**: Configurable request throttling
- **Mongo Sanitize**: NoSQL injection prevention
- **Sanitize HTML**: XSS attack mitigation
- **Cookie Parser**: Secure HTTP-only cookie handling

<a id="architecture"></a>
## 🏗 Architecture

### High Level System Design
See [High Level System Design](docs/SYSTEM_DESIGN.md) for detailed specifications.

### Backend Architecture

**Key Patterns:**
- **Dependency Injection**: IoC container (`container.js`) manages all dependencies
- **Factory Pattern**: Services, controllers, and middleware created via factory functions
- **Repository Pattern**: Database operations abstracted through `db-service.js`
- **Layered Architecture**: Routes → Controllers → Services → Database
- **Error Handling**: Centralized error middleware with custom error classes

See [Backend Architecture Documentation](docs/BACKEND_ARCHITECTURE.md) for detailed specifications.

### Frontend Architecture

**Key Features:**
- **Standalone Components**: Modern Angular architecture without NgModules
- **Signal-based State**: Reactive state management with Angular signals
- **Route Guards**: Authentication and authorization protection
- **Lazy Loading**: Code-splitting for optimized bundle sizes
- **Interceptors**: HTTP interceptor for JWT token injection

See [Frontend Architecture Documentation](docs/FRONTEND_ARCHITECTURE.md) for component specifications.

<a id="quick-start"></a>
## 📦 Quick Start

### Prerequisites

- **Docker**: Version 24.0 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.20 or higher (included with Docker Desktop)
- **Git**: For cloning the repository 

### Get Started

```bash
# 1. Clone the repository
git clone https://github.com/dev-murchi/job-application-tracker.git
cd job-application-tracker

# 2. Set up environment
cp .env.example .env.dev
# Edit .env.dev with your configuration (see docs/GETTING_STARTED.md)

# 3. Start development environment
docker compose --profile dev --env-file .env.dev up
```

**Access the application:**
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

For detailed setup instructions, production deployment, and troubleshooting, see **[Getting Started Guide](docs/GETTING_STARTED.md)**.

<a id="documentation"></a>
## 📚 Documentation

Complete documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| **[Getting Started](docs/GETTING_STARTED.md)** | Installation, setup, and deployment guide |
| **[API Documentation](docs/API.md)** | Complete REST API reference with examples |
| **[System Design](docs/SYSTEM_DESIGN.md)** | High-level architecture and technology stack |
| **[Backend Architecture](docs/BACKEND_ARCHITECTURE.md)** | Detailed backend design, patterns, and flows |
| **[Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)** | Angular component structure and state management |
| **[Infrastructure](docs/INFRASTRUCTURE.md)** | Docker, NGINX, deployment configurations |
| **[Security Guide](docs/SECURITY.md)** | Security features, best practices, and audit procedures |
| **[Contributing](docs/CONTRIBUTING.md)** | How to contribute to the project |

### Quick Links

- 🚀 **[Deployment Modes](docs/GETTING_STARTED.md#deployment-workflow)**: Dev, Test, Prod-Demo
- 🔐 **[Environment Configuration](docs/GETTING_STARTED.md#2-configure-environment)**: Required variables and secrets
- 🧪 **[Running Tests](docs/GETTING_STARTED.md#running-tests)**: Unit and integration testing
- 📖 **[API Endpoints](docs/API.md)**: Authentication, jobs, user management
- 🔒 **[Security Features](docs/SECURITY.md)**: JWT, rate limiting, input validation

<a id="project-structure"></a>
## 📁 Project Structure
```
jobs-api-v2/
├── .env.example               # Environment template
├── docker-compose.yml         # Multi-environment orchestration
├── README.md                  # Project README
├── docs/                      # Project documentations
├── backend/                   # Node.js/Express API
│   ├── app.js                 # Express app factory
│   ├── Dockerfile             # Backend container image
│   ├── config/                # Configuration management
│   ├── constants/             # Application constants
│   ├── container.js           # Dependency injection container
│   ├── controllers/           # Request handlers
│   ├── db/                    # Database connection & service
│   ├── errors/                # Custom error classes
│   ├── main.js                # Main 
│   ├── middleware/            # Custom middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route definitions
│   ├── schemas/               # Zod validation schemas
│   ├── services/              # Business logic layer
│   ├── server.js              # HTTP Server entry point
│   ├── tests/                 # Unit & integration tests
│   │   ├── unit/              # Unit test suites
│   │   ├── integration/       # Integration test suites
│   │   ├── jest-unit.json     # Jest unit test config
│   │   ├── jest-integration.json  # Jest integration test config
│   │   ├── jest-unit-setup.js     # Unit test setup
│   │   └── jest-integration-setup.js  # Integration test setup
│   └── utils/                 # Helper functions
├── frontend/                  # Angular SPA
│   ├── Dockerfile             # Frontend container image
│   └── src/                   # Source files
│       ├── index.html         # Application entry HTML
│       ├── main.ts            # Application bootstrap
│       ├── styles.css         # Global styles
│       ├── app/               # Application components
│       │   ├── app.ts         # Root component
│       │   ├── app.html       # Root template
│       │   ├── app.css        # Root styles
│       │   ├── app.config.ts  # Application configuration
│       │   ├── app.routes.ts  # Route definitions
│       │   ├── app.spec.ts    # Root component tests
│       │   ├── svg.config.ts  # SVG icon configuration
│       │   ├── api/           # API services
│       │   ├── core/          # Core services & guards
│       │   ├── features/      # Feature modules
│       │   │   ├── auth/      # Authentication feature
│       │   │   ├── dashboard/ # Dashboard feature
│       │   │   ├── landing/   # Landing page
│       │   │   └── not-found-page/  # 404 page
│       │   └── shared/        # Shared components & utilities
│       │       ├── components/  # Reusable components
│       │       ├── directives/  # Custom directives
│       │       ├── types/     # TypeScript type definitions
│       │       └── utils/     # Helper functions
│       ├── assets/            # Static assets (images, fonts)
│       └── mocks/             # Test mocks
└── nginx/                     # NGINX reverse proxy
    ├── conf.d/                # NGINX server configurations
    ├── generate-ssl.sh        # SSL certificate generation script
    └── nginx.conf             # Main NGINX configuration

```

<a id="security"></a>
## 🔒 Security

This application implements multiple layers of security. For complete details, see **[Security Guide](docs/SECURITY.md)**.

### Key Security Features

- **JWT Authentication**: HTTP-only cookies with configurable expiration
- **Password Security**: Bcrypt hashing with salt rounds
- **Rate Limiting**: Application-level and endpoint-specific throttling
- **Input Validation**: Zod schema validation on all endpoints
- **XSS Protection**: HTML sanitization with `sanitize-html`
- **NoSQL Injection**: MongoDB query sanitization
- **Security Headers**: Helmet middleware (CSP, HSTS, X-Frame-Options)
- **CORS Policy**: Configurable origin whitelist with credentials support
- **Request Size Limits**: Prevents payload-based DoS attacks

**Security Audit**:

```bash
# Check for vulnerabilities
cd backend && npm audit
cd frontend && npm audit
```

<a id="contributing"></a>
## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](docs/CONTRIBUTING.md)** for details.

### Quick Contribution Steps

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- **Backend**: ESLint + Prettier ([`backend/eslint.config.js`](backend/eslint.config.js))
- **Frontend**: Angular ESLint + Prettier
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)

### Testing Requirements

- Add unit tests for new services/controllers
- Add integration tests for API endpoints
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

<a id="support"></a>
## 📞 Support

- **Documentation**: [docs/](docs/)
- **Bug Reports**: [GitHub Issues](https://github.com/dev-murchi/job-application-tracker/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/dev-murchi/job-application-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dev-murchi/job-application-tracker/discussions)

<a id="acknowledgments"></a>
## 🙏 Acknowledgments

- Original inspiration: [Jobs API Project](https://github.com/dev-murchi/NodeJS-Express-Projects/tree/main/jobs-api/final)
- Special thanks to all [contributors](https://github.com/dev-murchi/job-application-tracker/graphs/contributors)

*Star ⭐ this repository if you find it helpful!*
