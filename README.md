# Fincheck — API

API REST para gerenciamento de financas pessoais. Controle contas bancarias, categorias e transacoes com autenticacao JWT.

![NestJS](https://img.shields.io/badge/-NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

## Tech Stack

- **NestJS 11** - Framework Node.js
- **Prisma 7** - ORM com PostgreSQL
- **JWT** - Autenticação com tokens de 7 dias
- **PostgreSQL 16** - Banco de dados relacional

## Pré-requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 14+
- Docker (para testes E2E)

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/fincheck` |
| `JWT_SECRET` | Secret para assinar JWTs | `my-super-secret` |
| `PORT` | Porta do servidor (opcional) | `3000` |

## Instalação

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm start:dev
```

## Testes

```bash
# Testes unitários
pnpm test

# Testes unitários com coverage
pnpm test:cov

# Testes E2E (requer Docker)
pnpm test:e2e
```

## API Docs

Com o servidor rodando, acesse a documentação Swagger:

```
http://localhost:3000/api-docs
```

## Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/signup` | - | Criar conta |
| POST | `/auth/signin` | - | Login |
| GET | `/users/me` | JWT | Perfil do usuário |
| POST | `/bank-accounts` | JWT | Criar conta bancária |
| GET | `/bank-accounts` | JWT | Listar contas (com saldo) |
| PUT | `/bank-accounts/:id` | JWT | Atualizar conta |
| DELETE | `/bank-accounts/:id` | JWT | Deletar conta |
| GET | `/categories` | JWT | Listar categorias |
| POST | `/transactions` | JWT | Criar transação |
| GET | `/transactions` | JWT | Listar (filtros: month, year, bankAccountId, type) |
| PUT | `/transactions/:id` | JWT | Atualizar transação |
| DELETE | `/transactions/:id` | JWT | Deletar transação |
| GET | `/health` | - | Health check |

## Arquitetura

```
src/
├── modules/
│   ├── auth/          # Signup, signin, JWT guard
│   ├── users/         # Perfil do usuário
│   ├── bank-accounts/ # CRUD contas + cálculo de saldo
│   ├── categories/    # Categorias (12 padrão no signup)
│   └── transactions/  # CRUD transações + filtros
├── shared/
│   ├── database/      # PrismaService + Repositories
│   ├── config/        # Validação de env vars
│   ├── decorators/    # @IsPublic(), @ActiveUserId()
│   └── pipes/         # OptionalParseUUIDPipe, OptionalParseEnumPipe
└── test-utils/        # Factories e mocks para testes
```

### Data Model

```
User (1) ──┬── (*) BankAccount ──── (*) Transaction
           ├── (*) Category ─────────────┘
           └── (*) Transaction
```

## Docker

```bash
# Desenvolvimento local
docker compose up -d

# Produção (usa RDS)
docker compose -f docker-compose.prod.yml up -d
```

## Deploy

O deploy é feito via GitHub Actions CI/CD:
- **CI**: Lint, build, testes unitários e E2E em cada PR
- **CD**: Build Docker image, push para GHCR, deploy no EC2 via SSH

## Relacionados

- [Fincheck Web](https://github.com/mbdevlabs/fincheck-web) — Frontend React
