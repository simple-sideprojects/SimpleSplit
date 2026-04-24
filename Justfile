set shell := ["bash", "-cu"]

# Default target: list available recipes.
default:
    @just --list

# ── Dev ────────────────────────────────────────────────────────────────────

# Full stack (Postgres + backend + frontend) via docker compose.
dev:
    docker compose up --build

# Postgres + FastAPI only.
dev-backend:
    docker compose up --build postgres backend

# SvelteKit dev server. Expects a backend on :8000.
dev-frontend:
    cd frontend && pnpm install && pnpm dev

# ── API contract ──────────────────────────────────────────────────────────

# Regenerate the committed OpenAPI snapshot + the typed frontend client.
# Run this whenever you touch FastAPI routers or request/response models.
generate-api:
    cd backend && python -m app.scripts.dump_openapi
    cd frontend && pnpm generate:api

# ── Quality gates ─────────────────────────────────────────────────────────

# Everything CI runs.
test: test-backend test-frontend

# Backend pytest. Test env vars are inlined so the recipe works without a
# checked-in `.env` (and matches what CI does). conftest.py overrides these
# via its TestSettings fixture once the app is imported.
test-backend:
    cd backend && \
        PROD=False \
        FRONTEND_URL=http://localhost:3000 \
        DATABASE_URL=sqlite:///:memory: \
        SECRET_KEY=test-secret \
        ALGORITHM=HS256 \
        ACCESS_TOKEN_EXPIRE_MINUTES=30 \
        SMTP_SERVER=localhost \
        SMTP_PORT=587 \
        SMTP_USER=u \
        SMTP_PASSWORD=p \
        SMTP_USE_TLS=False \
        SENDER_EMAIL=test@example.com \
        EMAIL_ACCOUNT_VERIFICATION=False \
        python -m pytest -q

test-frontend:
    cd frontend && pnpm test:unit --run

# Ruff + ESLint + svelte-check.
lint:
    cd backend && ruff check .
    cd frontend && pnpm lint
    cd frontend && pnpm check

# Auto-fix formatting + lint across the repo.
format:
    cd backend && ruff check --fix .
    cd backend && ruff format .
    cd frontend && pnpm lint:fix

# ── Housekeeping ──────────────────────────────────────────────────────────

# Remove caches + build artifacts. Safe — doesn't touch sources or .env.
clean:
    find backend -type d \( -name __pycache__ -o -name .pytest_cache -o -name .ruff_cache \) -prune -exec rm -rf {} +
    rm -rf frontend/.svelte-kit frontend/build-node frontend/build-static

# Also removes node_modules. Follow with `pnpm install` before dev again.
clean-all: clean
    rm -rf frontend/node_modules
