# SimpleSplit

A modern bill-splitting app for groups. Track shared expenses, settle balances,
and invite friends via email or link. Runs as a server-rendered web app and as
native iOS/Android apps from the same codebase.

## Architecture

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Web (SSR)      │        │  Capacitor app   │        │  PR CI / drift   │
│   SvelteKit +    │        │  (iOS, Android)  │        │  check           │
│   adapter-node   │        │  SPA bundle from │        │                  │
│                  │        │  adapter-static  │        │  OpenAPI snapshot│
└────────┬─────────┘        └────────┬─────────┘        │  drives frontend │
         │                           │                  │  client codegen  │
         │   Bearer token + HTTP     │                  └──────────────────┘
         ▼                           ▼
┌───────────────────────────────────────────────┐
│   FastAPI + SQLModel + Alembic                │
│   Postgres                                    │
└───────────────────────────────────────────────┘
```

- **Frontend** (`frontend/`): SvelteKit 2, Svelte 5, Tailwind 4, Paraglide i18n,
  TanStack Query, sveltekit-superforms, Capacitor 7. The API client is
  generated from the FastAPI OpenAPI schema via `@hey-api/openapi-ts`.
- **Backend** (`backend/`): FastAPI, SQLModel, Alembic, pydantic-settings,
  pytest. Serves JWT-authenticated REST endpoints consumed by both deploy
  targets.
- **Contract**: `backend/openapi.json` is a committed snapshot of the FastAPI
  schema. `pnpm generate:api` reads it directly (no live backend required) and
  regenerates the typed client + TanStack Query bindings + Zod schemas.

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

Prerequisites: Node 22+, pnpm 10+, Python 3.12+.

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

Or, with `just` installed:

```bash
just dev          # everything
just dev-backend  # FastAPI only
just dev-frontend # SvelteKit only
```

## Common tasks

| Task | Command |
|---|---|
| Regenerate typed API client | `cd frontend && pnpm generate:api` |
| Refresh the committed OpenAPI snapshot | `cd backend && python -m app.scripts.dump_openapi` |
| Backend tests | `cd backend && pytest` |
| Frontend unit tests | `cd frontend && pnpm test:unit` |
| Frontend e2e | `cd frontend && pnpm exec playwright test` |
| Web production build | `cd frontend && pnpm build:node` |
| Capacitor SPA build | `cd frontend && pnpm build:capacitor` |

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
