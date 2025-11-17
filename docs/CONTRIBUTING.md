# Contributing to Job Application Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone, regardless of:

- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior**:
- Trolling, insulting/derogatory comments, personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/job-application-tracker.git
cd job-application-tracker

# Add upstream remote
git remote add upstream https://github.com/dev-murchi/job-application-tracker.git
```

### 2. Set Up Development Environment

```bash
# Copy environment file
cp .env.example .env.dev

# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.dev

# Set MongoDB credentials
echo "MONGO_INITDB_ROOT_USERNAME=dev_user" >> .env.dev
echo "MONGO_INITDB_ROOT_PASSWORD=dev_pass" >> .env.dev

# Start development environment
docker compose --profile dev --env-file .env.dev up
```

### 3. Create a Feature Branch

```bash
# Create branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## Development Workflow

### Making Changes

1. **Write code** following our [coding standards](#coding-standards)
2. **Add tests** for new functionality
3. **Run tests** to ensure nothing breaks
4. **Update documentation** if needed
5. **Commit changes** with descriptive messages

### Running the Development Server

```bash
# Start all services
docker compose --profile dev --env-file .env.dev up

# View logs
docker compose --profile dev logs -f backend-dev
docker compose --profile dev logs -f frontend-dev
```

**Access Points**:
- Frontend: http://localhost:4200
- Backend: http://localhost:3003
- MongoDB: Internal only (not exposed)

### Hot Reload

Both frontend and backend automatically reload on code changes:

- **Frontend**: Angular watches `frontend/src/` and recompiles
- **Backend**: nodemon watches `backend/` and restarts server

## Coding Standards

### Backend (Node.js/Express)

**ESLint Configuration**: [`backend/eslint.config.js`](../backend/eslint.config.js)

**Prettier Configuration**: [`backend/package.json`](../backend/package.json)

```javascript
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

**Run linting**:

```bash
# Check for issues
docker exec -it backend-dev npm run lint

# Auto-fix issues
docker exec -it backend-dev npm run lint:fix

# Format code
docker exec -it backend-dev npm run format
```

**Best Practices**:

- Use `async/await` instead of callbacks
- Use dependency injection via container
- Throw custom errors (`BadRequestError`, `UnauthenticatedError`, etc.)
- Use Zod schemas for validation
- Keep controllers thin (delegate to services)
- Write JSDoc comments for functions

**Example**:

```javascript
/**
 * Create a new job application
 * @param {Object} jobData - Job application data
 * @param {string} userId - ID of the user creating the job
 * @returns {Promise<Object>} Created job document
 * @throws {BadRequestError} If validation fails
 */
const createJob = async (jobData, userId) => {
  const job = await Job.create({ ...jobData, createdBy: userId });
  return job;
};
```

### Frontend (Angular/TypeScript)

**ESLint Configuration**: [`frontend/eslint.config.js`](../frontend/eslint.config.js)

**Run linting**:

```bash
docker exec -it frontend-dev npm run lint
```

**Best Practices**:

- Use standalone components (no NgModules)
- Use signals for reactive state
- Use `input()` and `output()` for component API
- Use RxJS for async operations
- Keep components focused (single responsibility)
- Use TypeScript strict mode

**Example**:

```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-job-card',
  standalone: true,
  templateUrl: './job-card.html',
})
export class JobCardComponent {
  // Input signal
  job = input.required<Job>();
  
  // Output events
  edit = output<string>();
  delete = output<string>();
  
  onEdit() {
    this.edit.emit(this.job()._id);
  }
}
```

### File Naming Conventions

**Backend**:
- Files: `kebab-case.js` (e.g., `job.service.js`)
- Classes: `PascalCase` (e.g., `JobService`)
- Functions: `camelCase` (e.g., `createJob`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

**Frontend**:
- Components: `kebab-case.ts` (e.g., `job-card.ts`)
- Services: `kebab-case.ts` (e.g., `jobs-api.ts`)
- Types/Interfaces: `PascalCase` (e.g., `Job`, `JobFilters`)


## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files

### Scopes

- `backend`: Backend code
- `frontend`: Frontend code
- `api`: API endpoints
- `auth`: Authentication
- `jobs`: Job management
- `user`: User management
- `db`: Database
- `docker`: Docker configuration
- `docs`: Documentation

### Examples

```bash
# Feature
git commit -m "feat(jobs): add job export to CSV functionality"

# Bug fix
git commit -m "fix(auth): resolve cookie expiration issue in production"

# Documentation
git commit -m "docs(api): update authentication endpoint examples"

# Refactor
git commit -m "refactor(backend): simplify error handling middleware"

# Breaking change
git commit -m "feat(api)!: change job status enum values

BREAKING CHANGE: Status values changed from snake_case to kebab-case"
```


## Pull Request Process

### 1. Sync with Upstream

```bash
# Fetch latest changes
git fetch upstream

# Rebase your branch
git rebase upstream/main
```

### 2. Run Tests

```bash
# Backend tests
docker compose --profile backend-test --env-file .env.test up -d
docker exec -it backend-test npm run test
docker compose --profile backend-test down -v

# Frontend tests
docker compose --profile frontend-test --env-file .env.test up -d
docker exec -it frontend-test npm run test
docker compose --profile frontend-test down
```

### 3. Run Linters

```bash
# Backend
docker exec -it backend-dev npm run lint
docker exec -it backend-dev npm run format:check

# Frontend
docker exec -it frontend-dev npm run lint
```

### 4. Create Pull Request

**Title**: Use conventional commit format

```
feat(jobs): add job export functionality
```

**Description Template**:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Added job export service
- Created CSV formatter
- Updated jobs controller with export endpoint
- Added integration tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #123
```

### 5. Code Review

- Respond to review comments promptly
- Make requested changes in new commits
- Don't force-push after review has started
- Mark conversations as resolved when addressed

## Testing Requirements

### Unit Tests

**Required for**:
- Services (business logic)
- Utility functions
- Middleware
- Controllers (mocked dependencies)

**Example** (`backend/tests/unit/services/job.service.test.js`):

```javascript
describe('JobService', () => {
  describe('createJob', () => {
    it('should create job with default status', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Engineer'
      };
      
      const job = await jobService.createJob(jobData, userId);
      
      expect(job.status).toBe('pending');
      expect(job.company).toBe('Tech Corp');
    });
  });
});
```

### Integration Tests

**Required for**:
- API endpoints
- Database operations
- End-to-end workflows

**Example** (`backend/tests/integration/jobs.test.js`):

```javascript
describe('POST /api/v1/jobs', () => {
  it('should create job when authenticated', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .set('Cookie', authCookie)
      .send({
        company: 'Tech Corp',
        position: 'Engineer'
      })
      .expect(201);
    
    expect(response.body.job).toHaveProperty('_id');
    expect(response.body.job.status).toBe('pending');
  });
});
```

### Coverage Requirements

- **Unit tests**: Aim for >80% coverage
- **Integration tests**: Cover all API endpoints
- **Critical paths**: 100% coverage (auth, data access)

**View coverage**:

```bash
# Backend
open backend/coverage/unit/lcov-report/index.html
open backend/coverage/integration/lcov-report/index.html

# Frontend
open frontend/coverage/job-application-tracker/frontend/index.html
```

## Documentation

### When to Update Documentation

Update documentation when you:

- Add new API endpoints
- Change existing endpoint behavior
- Add environment variables
- Change deployment process
- Add new features
- Fix bugs that affect documentation

### Documentation Files

- `README.md`: Project overview (auto-generated from templates)
- `docs/GETTING_STARTED.md`: Setup and quick start
- `docs/API.md`: API endpoint reference
- `docs/BACKEND_ARCHITECTURE.md`: Backend design
- `docs/FRONTEND_ARCHITECTURE.md`: Frontend design
- `docs/INFRASTRUCTURE.md`: Docker/deployment
- `docs/SYSTEM_DESIGN.md`: High-level architecture
- `docs/SECURITY.md`: Security practices
- `docs/CONTRIBUTING.md`: This file

### Code Comments

**When to add comments**:
- Complex algorithms
- Non-obvious business logic
- Workarounds for known issues
- Public API functions (JSDoc)

**When NOT to comment**:
- Self-explanatory code
- Redundant descriptions
- Outdated information

## Getting Help

### Resources

- **Documentation**: [`docs/`](../docs/)
- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions, share ideas

### Questions?

- Check existing issues and discussions first
- Provide minimal reproducible example
- Include environment details (OS, Docker version, etc.)
- Share relevant logs


## Recognition

Contributors will be recognized in:

- GitHub contributors page
- Release notes (for significant contributions)
- Project README (optional)

**Thank you for contributing!** 🎉
