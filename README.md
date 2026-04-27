# SimpleSplit

A modern bill-splitting app for groups. Track shared expenses, settle balances,
and invite friends via email or link. Runs as a server-rendered web app and as
native iOS/Android apps from the same codebase.

## Architecture

```
┌──────────────────┐         ┌──────────────────┐
│   Web (SSR)      │         │  Capacitor app   │
│   SvelteKit +    │         │  (iOS, Android)  │
│   adapter-node   │         │  SPA from        │
│                  │         │  adapter-static  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │  HTTP, Bearer token        │
         ▼                            ▼
        ┌──────────────────────────────┐
        │   FastAPI + SQLModel         │
        │   Postgres                   │
        └──────────────────────────────┘
```

- **Frontend** (`frontend/`): SvelteKit 2, Svelte 5, Tailwind 4, Paraglide i18n,
  TanStack Query, sveltekit-superforms, Capacitor 7. The API client is
  generated from the FastAPI OpenAPI schema via `@hey-api/openapi-ts`.
- **Backend** (`backend/`): FastAPI, SQLModel, Alembic, pydantic-settings,
  pytest. JWT-authenticated REST endpoints consumed by both deploy targets.
- **Contract**: `backend/openapi.json` is a committed snapshot of the FastAPI
  schema. The frontend generator reads it directly, so the typed client can
  be regenerated without a running backend, and CI fails any PR where the
  snapshot and client would drift apart.

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Postgres: localhost:5432

## Local development (without Docker)

Prerequisites: Node 24+, pnpm 10+, Python 3.13+.

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev
```

## Common tasks

Backend (`cd backend`):

| Task | Command |
|---|---|
| Run tests | `pytest` |
| Lint | `ruff check .` |
| Refresh OpenAPI snapshot | `python -m app.scripts.dump_openapi` |

Frontend (`cd frontend`):

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Lint + type-check | `pnpm lint && pnpm check` |
| Unit tests | `pnpm test:unit` |
| E2E tests | `pnpm exec playwright test` |
| Web build | `pnpm build:node` |
| Capacitor SPA build | `pnpm build:capacitor` |
| Regenerate SDK from `backend/openapi.json` | `pnpm generate:api` |

When you change a FastAPI router or model, regenerate both halves:

```bash
( cd backend && python -m app.scripts.dump_openapi ) && \
  ( cd frontend && pnpm generate:api )
```

Commit both `backend/openapi.json` and `frontend/src/lib/client/`. CI's
`api-drift` job will fail the PR if you forget.

## Repository layout

```
backend/
  app/
    routers/             one router per resource
    services/            auth, balance, email
    database/models/     SQLModel entities
    dependencies/        FastAPI `CurrentUser` / `CurrentSettings`
    scripts/             dump_openapi.py
    exceptions.py        unified error envelope + request_id
    logging_config.py    JSON logging + request-id middleware
    main.py              app factory, CORS, exception handlers
  alembic/               migrations
  tests/                 pytest suite
  openapi.json           committed schema snapshot (the contract)
frontend/
  src/
    routes/              SvelteKit routes (universal +page.ts only)
    lib/
      client/            generated SDK (do not edit by hand)
      query/             QueryClient factory + shared queryOptions
      server/            SSR-only helpers (per-request SDK client)
      shared/auth/       authStorage, interceptor, login/register flows
      shared/form/       superForm wrapper (SPA-mode default)
      components/        UI components
    hooks.server.ts      SSR lifecycle, auth, request-bound fetch
    hooks.client.ts      installs the SDK auth interceptor
  tests/                 Playwright e2e
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
