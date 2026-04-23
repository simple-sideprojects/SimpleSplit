# Contributing

Thanks for your interest! This doc covers how to get the project running and
what we expect from a good pull request.

## Development setup

Prerequisites: Node 22+ (see `.nvmrc`), pnpm 10+, Python 3.12+. Docker optional
but recommended for running Postgres.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Or run the stack piece by piece via `just`:

```bash
just dev          # full stack (docker compose)
just dev-backend  # postgres + FastAPI
just dev-frontend # SvelteKit (expects backend on :8000)
```

## The API contract

The frontend talks to the backend through a typed client generated from the
backend's OpenAPI schema. The schema is a committed snapshot — not a live
fetch — so nobody has to run the backend just to regenerate the client, and
CI can detect drift with a pure `git diff`.

**If you change anything touching the FastAPI surface (routers, request/
response models, status codes), you must:**

```bash
just generate-api   # or, manually:
# cd backend && python -m app.scripts.dump_openapi
# cd frontend && pnpm generate:api
```

…and commit both `backend/openapi.json` and `frontend/src/lib/client/**`.

CI's `api-drift` job runs exactly this and fails if the committed files would
change. That's the contract enforcement.

## Tests + checks before pushing

```bash
just test   # backend pytest + frontend vitest
just lint   # ruff + eslint + svelte-check
```

Everything CI runs is available locally through `just`.

## Commit + PR style

- Conventional-ish commit messages (`feat:`, `fix:`, `chore:`, `refactor:`,
  `test:`, `docs:`) — useful for the changelog.
- PR title: the shipping summary. Body: what + why + how it was tested.
- Keep PRs reviewable. Big refactors land in phases; see the PR series that
  landed this architecture.

## Architectural invariants

- **Single data path.** Universal `+page.ts` loaders call the generated SDK.
  SSR uses `event.fetch`; client uses `window.fetch`. No dual `+page.server.ts`
  + `onMount(onPageLoad)` paths.
- **Token transport is always `Authorization: Bearer <token>`.** Storage
  differs — httpOnly cookie on SSR web, `@capacitor/preferences` in the
  browser/app. See `frontend/src/lib/shared/auth/storage.ts`.
- **Per-request SDK client on SSR.** `event.locals.api` is built fresh in
  `hooks.server.ts` with the request's `fetch` + token. Never mutate the
  module-scoped client on the server.
- **TanStack Query owns server-state cache.** `auth.store` is session state
  only. The stores under `shared/stores/` (groups/balances/transactions) are
  legacy and should disappear in follow-ups.
