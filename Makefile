.PHONY: db-up db-down frontend backend setup-frontend setup-backend setup generate-types

# Cross-platform support
ifeq ($(OS),Windows_NT)
    VENV_BIN = venv/Scripts
    PYTHON = python
else
    VENV_BIN = venv/bin
    PYTHON = python3
endif

# Database
db-up:
	docker compose up -d

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

# Run services
frontend:
	cd frontend && npm run dev

backend:
	cd api && $(VENV_BIN)/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Setup
setup-frontend:
	cd frontend && npm install

setup-backend:
	cd api && $(PYTHON) -m venv venv && $(VENV_BIN)/pip install -r requirements.txt && $(VENV_BIN)/alembic upgrade head

setup: setup-frontend setup-backend

# TypeScript Types Generation
generate-types:
	cd frontend && npm run generate:types

# Database migrations (backend)
db-migrate:
	cd api && $(VENV_BIN)/alembic upgrade head

db-migrate-create:
	cd api && $(VENV_BIN)/alembic revision --autogenerate -m "$(message)"
