# Contributing

Thanks for your interest! This doc covers how to get the project running and
what we expect from a good pull request.

## Development setup

Prerequisites: Node 24+ (see `.nvmrc`), pnpm 10+, Python 3.13+. Docker optional
but recommended for running Postgres.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

See the [README](./README.md#common-tasks) for the per-side command list
(pytest / pnpm scripts).

## The API contract

The frontend talks to the backend through a typed client generated from the
backend's OpenAPI schema. The schema is a committed snapshot — not a live
fetch — so nobody has to run the backend just to regenerate the client, and
CI can detect drift with a pure `git diff`.

If you change anything touching the FastAPI surface (routers, request/
response models, status codes), regenerate both halves and commit them:

```bash
( cd backend && python -m app.scripts.dump_openapi ) && \
  ( cd frontend && pnpm generate:api )
```

CI's `api-drift` job runs exactly this and fails if the committed files would
change.

## Tests + checks before pushing

```bash
( cd backend && pytest && ruff check . )
( cd frontend && pnpm lint && pnpm check && pnpm test:unit --run )
```

## Commit + PR style

- Conventional-ish commit messages (`feat:`, `fix:`, `chore:`, `refactor:`,
  `test:`, `docs:`) — useful for the changelog.
- PR title: the shipping summary. Body: what + why + how it was tested.
- Keep PRs reviewable. Big refactors land in phases.

## Architectural invariants

- **Single data path.** Every route is a universal `+page.ts` (or `+layout.ts`)
  that calls the generated SDK and prefetches into TanStack Query. SSR
  executes the load on the server with `event.fetch`; the browser/Capacitor
  executes it with `window.fetch`. Do not add `+page.server.ts` / `+layout.server.ts`
  unless you need a genuinely server-only surface (and then keep data fetching
  in the universal loader).
- **Token transport is always `Authorization: Bearer <token>`.** Storage
  differs: httpOnly cookie for SSR (written by `/api/auth/{login,register}`,
  read by `hooks.server.ts`); `@capacitor/preferences` for the browser and
  native app via `lib/shared/auth/storage.ts`.
- **Per-request SDK client on SSR.** `hooks.server.ts` publishes
  `event.locals.api` (built with the request's `fetch` + token) and wraps
  `event.fetch` so any universal-loader call to `PUBLIC_BACKEND_URL` carries
  the Bearer header. Never mutate a module-scoped SDK client from a request.
- **TanStack Query owns cached server state.** `auth.store` holds the session
  `user` only (plain `writable`, no persistence). There is no other
  client-side data store.
- **The OpenAPI snapshot is the contract.** Don't edit `frontend/src/lib/client/**`
  by hand — regenerate via `python -m app.scripts.dump_openapi` +
  `pnpm generate:api`. CI's `api-drift` job rejects PRs where the snapshot
  or the generated client would change.
