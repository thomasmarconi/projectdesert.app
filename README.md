# Project Desert

A full-stack application with a Next.js frontend and FastAPI backend.

## Prerequisites

- Node.js (v18+)
- Python 3.11+
- Docker

## Quick Start

```bash
# 1. Start the database
make db-up

# 2. Configure environment
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
# Edit frontend/.env and add your AUTH_SECRET and Google OAuth credentials

# 3. Install dependencies and run migrations
make setup

# 4. Run database migrations
make db-migrate

# 5. Run both services (in separate terminals)
make frontend  # http://localhost:3000
make backend   # http://localhost:8000
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make db-up` | Start PostgreSQL |
| `make db-down` | Stop PostgreSQL |
| `make db-logs` | View database logs |
| `make setup` | Install all dependencies (frontend & backend) |
| `make setup-frontend` | Install frontend dependencies only |
| `make setup-backend` | Install backend dependencies only |
| `make frontend` | Run Next.js dev server |
| `make backend` | Run FastAPI server |
| `make generate-types` | Generate TypeScript types from OpenAPI schema |
| `make db-migrate` | Run Alembic database migrations |
| `make db-migrate-create message="description"` | Create new Alembic migration |

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret key used to encode JWT |

### Backend (`api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret key used to decode JWT |
