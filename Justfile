set shell := ["bash", "-cu"]

default:
    @just --list

# Full-stack dev — backend + frontend in parallel, via docker compose.
dev:
    docker compose up --build

# Start just the backend (Postgres + FastAPI).
dev-backend:
    docker compose up --build postgres backend

# Start just the frontend (assumes a backend on localhost:8000).
dev-frontend:
    cd frontend && pnpm install && pnpm dev

# Regenerate the typed frontend client from backend OpenAPI.
generate-api:
    cd backend && python -m app.scripts.dump_openapi
    cd frontend && pnpm generate:api

# Run everything CI runs.
test: test-backend test-frontend

test-backend:
    cd backend && python -m pytest -q

test-frontend:
    cd frontend && pnpm test:unit --run

# Lint + type-check both sides.
lint:
    cd backend && ruff check .
    cd frontend && pnpm lint && pnpm check

# Auto-fix formatting across the repo.
format:
    cd backend && ruff check --fix .
    cd frontend && pnpm lint:fix

# Clean caches + build artifacts.
clean:
    rm -rf backend/.pytest_cache backend/**/__pycache__
    rm -rf frontend/node_modules frontend/.svelte-kit frontend/build-*
