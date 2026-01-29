.PHONY: db-up db-down frontend backend setup-frontend setup-backend setup

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
	cd api && source venv/bin/activate && fastapi dev main.py

# Setup
setup-frontend:
	cd frontend && npm install && npx prisma generate

setup-backend:
	cd api && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt && prisma generate

setup: setup-frontend setup-backend

# Database migrations
db-push:
	cd frontend && npx prisma db push

db-studio:
	cd frontend && npx prisma studio
