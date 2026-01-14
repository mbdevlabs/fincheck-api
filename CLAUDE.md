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

NestJS modules follow the pattern: `module.ts`, `controller.ts`, `service.ts`, `dto/` folder.

### Database Layer

- **PrismaService** (`src/database/prisma.service.ts`): Extends PrismaClient, uses `@prisma/adapter-pg` for PostgreSQL
- **Generated Client**: Prisma generates client to `src/generated/prisma/` (not `node_modules`)
- **Schema**: `prisma/schema.prisma` - uses snake_case for table/column names via `@@map` and `@map`

### Data Models

- **User**: Has bank accounts, categories, and transactions
- **BankAccount**: Types are CHECKING, INVESTMENT, CASH (via `BankAccountType` enum)
- **Category**: Transaction categories with type (INCOME/OUTCOME)
- **Transaction**: Links user, bank account, and optional category

### Validation

Uses `class-validator` decorators in DTOs with global `ValidationPipe` enabled in `main.ts`.

## Environment

Requires `DATABASE_URL` environment variable for PostgreSQL connection. Uses `dotenv/config` in entry points.

## Issues e Tasks do Curso

### Bugs/Correções

- [x] Corrigir typo no enum `CHECHING` -> `CHECKING` em `prisma/schema.prisma:24`
- [x] ~~Corrigir teste E2E~~ - Removido junto com app.controller/service (não mais necessário)

### Segurança

- [x] Implementar hash de senha com bcrypt no `UsersService.create()`
- [ ] Adicionar autenticação JWT

### Melhorias de Arquitetura

- [ ] Criar `DatabaseModule` global para o `PrismaService` (evitar injeção repetida em cada módulo)
- [x] Adicionar tratamento de erros para email duplicado no cadastro de usuário

### Módulos a Implementar

- [ ] `BankAccountModule` - CRUD de contas bancárias
- [ ] `CategoryModule` - CRUD de categorias
- [ ] `TransactionModule` - CRUD de transações

### Estrutura de Dados

```
User (1) ──┬── (*) BankAccount ──── (*) Transaction
           ├── (*) Category ─────────────┘
           └── (*) Transaction
```
