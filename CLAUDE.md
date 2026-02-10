# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS API for a personal finance application ("fincheck") that manages users, bank accounts, categories, and transactions. It uses Prisma ORM with PostgreSQL.

## Common Commands

```bash
# Development
pnpm start:dev          # Run with hot reload
pnpm start              # Run without watch mode
pnpm start:debug        # Run with debugger attached

# Build
pnpm build              # Compile TypeScript to dist/

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run tests with coverage
pnpm test:e2e           # Run end-to-end tests

# Code Quality
pnpm lint               # Run ESLint with auto-fix
pnpm format             # Run Prettier

# Database (Prisma)
pnpm prisma generate    # Regenerate Prisma client (outputs to src/generated/prisma/)
pnpm prisma migrate dev # Create and apply migrations
pnpm prisma db push     # Push schema changes without migrations
```

## Architecture

### Module Structure

NestJS modules follow the pattern: `module.ts`, `controller.ts`, `services/`, `dto/` folder.

### Database Layer

- **PrismaService** (`src/shared/database/prisma.service.ts`): Extends PrismaClient, uses `@prisma/adapter-pg` for PostgreSQL
- **DatabaseModule** (`src/shared/database/database.module.ts`): Global module that provides PrismaService and repositories
- **Generated Client**: Prisma generates client to `src/generated/prisma/` (not `node_modules`)
- **Schema**: `prisma/schema.prisma` - uses snake_case for table/column names via `@@map` and `@map`

### Repository Layer

All repositories in `src/shared/database/repositories/`:

| Repository | Methods |
|------------|---------|
| `UsersRepository` | `create()`, `findUnique()` |
| `BankAccountsRepository` | `findMany()`, `findFirst()`, `create()`, `update()`, `delete()` |
| `CategoriesRepository` | `findMany()`, `findFirst()` |
| `TransactionsRepository` | `findMany()`, `findFirst()`, `create()`, `update()`, `delete()` |

### Data Models

```
User (1) ──┬── (*) BankAccount ──── (*) Transaction
           ├── (*) Category ─────────────┘
           └── (*) Transaction
```

- **User**: Has bank accounts, categories, and transactions
- **BankAccount**: Types are CHECKING, INVESTMENT, CASH (via `BankAccountType` enum)
- **Category**: Transaction categories with type (INCOME/OUTCOME)
- **Transaction**: Links user, bank account, and optional category

### Validation

- Global `ValidationPipe` enabled in `main.ts`
- DTOs use `class-validator` decorators
- Custom pipes in `src/shared/pipes/`:
  - `OptionalParseUUIDPipe` - Validates UUID only if value is provided
  - `OptionalParseEnumPipe` - Validates enum only if value is provided

### Authentication

- **JWT-based**: Uses `@nestjs/jwt` with global `AuthGuard` (7 days expiration)
- **Endpoints**: `POST /auth/signin` (login), `POST /auth/signup` (register with auto-login)
- **Protected routes**: All routes require valid JWT by default
- **Public routes**: Use `@IsPublic()` decorator (`src/shared/decorators/IsPublic.ts`) to bypass auth
- **User context**: `@ActiveUserId()` decorator extracts `userId` from request

### Environment Validation

Environment variables are validated at startup using `class-validator` in `src/shared/config/env.ts`:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for JWT signing (must not be "TESTE_PARA_SECRET")
- `PORT` - Server port (defaults to 3000)

---

## API Endpoints

### Auth Module (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | Public | Register new user (creates 12 default categories) |
| POST | `/auth/signin` | Public | Login with email/password |

**Signup**: Creates user with hashed password (bcrypt, 12 rounds) and 12 default categories:
- Income: Salário, Freelance, Outro
- Expense: Casa, Alimentação, Educação, Lazer, Mercado, Roupas, Transporte, Viagem, Outro

### Users Module (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Required | Get current user profile (name, email) |

### Bank Accounts Module (`/bank-accounts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bank-accounts` | Required | Create new bank account |
| GET | `/bank-accounts` | Required | Get all accounts with `currentBalance` |
| PUT | `/bank-accounts/:bankAccountId` | Required | Update bank account |
| DELETE | `/bank-accounts/:bankAccountId` | Required | Delete bank account (204) |

**Current Balance Calculation**: `initialBalance + sum(INCOME) - sum(OUTCOME)`

### Categories Module (`/categories`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | Required | Get all user's categories |

### Transactions Module (`/transactions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transactions` | Required | Create new transaction |
| GET | `/transactions` | Required | Get transactions with filters |
| PUT | `/transactions/:transactionId` | Required | Update transaction |
| DELETE | `/transactions/:transactionId` | Required | Delete transaction (204) |

**GET Query Parameters**:
- `month` (required, int) - Month (0-11)
- `year` (required, int) - Year
- `bankAccountId` (optional, UUID) - Filter by bank account
- `type` (optional, INCOME/OUTCOME) - Filter by type

### Ownership Validation

All modules have dedicated ownership validation services:
- `ValidateBankAccountOwnershipService`
- `ValidateCategoryOwnershipService`
- `ValidateTransactionOwnershipService`

Throws `NotFoundException` if resource doesn't belong to user.

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/POST/PUT |
| 201 | Resource created (implicit) |
| 204 | Successful DELETE |
| 400 | Validation failure |
| 401 | Missing/invalid JWT |
| 404 | Resource not found / ownership validation failed |
| 409 | Email already in use (signup) |

---

## Roadmap

### Completed Features

- [x] Authentication (signup/signin with JWT)
- [x] Users (get profile)
- [x] Bank Accounts (full CRUD with current balance calculation)
- [x] Categories (read-only, auto-created on signup)
- [x] Transactions (full CRUD with filters and ownership validation)
- [x] Global authentication guard
- [x] Custom optional validation pipes
- [x] CORS enabled
- [x] Health Check endpoint (`GET /health`)
- [x] Security middleware (helmet, compression)
- [x] Database indexes (userId, bankAccountId, date)
- [x] API Documentation (Swagger at `/api-docs`)
- [x] Unit tests (41 tests, 11 suites)
- [x] E2E tests (23 tests, 5 suites)
- [x] Docker (multi-stage Dockerfile + docker-compose)
- [x] CI/CD (GitHub Actions)
- [x] AWS deploy configs (EC2 + RDS + Nginx)

### Pending Features

- [ ] **Categories CRUD** - Create, update, delete categories
- [ ] **Pagination** - Add pagination to list endpoints (transactions, bank accounts)
- [ ] **Sorting** - Allow sorting by date, value, name on list endpoints
- [ ] **Dashboard Stats** - Endpoint for financial summary (total income/outcome by period)
- [ ] **Recurring Transactions** - Support for scheduled/recurring transactions
- [ ] **Transaction Search** - Search transactions by name
- [ ] **Export Data** - Export transactions to CSV/PDF
- [ ] **Multi-currency** - Support for different currencies
- [ ] **Budget/Goals** - Set spending limits per category

### Improvements

- [ ] **Error Handling** - Global exception filter for consistent error responses
- [ ] **Logging** - Request/response logging interceptor
- [ ] **Rate Limiting** - Add `@nestjs/throttler` to prevent abuse
- [ ] **Soft Delete** - Add `deletedAt` field instead of hard delete
- [ ] **Audit Trail** - Track who created/updated records and when
- [ ] **Input Sanitization** - Sanitize string inputs to prevent XSS
- [ ] **Caching** - Add Redis for caching frequent queries
