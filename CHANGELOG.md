# Changelog

All notable changes to this project will be documented in this file. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Universal `+page.ts` / `+layout.ts` loaders backed by TanStack Query for
  every route. `lib/query/options.ts` exposes shared `xxxQueryOptions(id)`
  helpers reused by loaders and components.
- Per-request SDK client on SSR (`lib/server/api.ts`) and a `hooks.server.ts`
  wrapper that injects the Bearer header for backend calls.
- `lib/shared/auth/`: `authStorage` over `@capacitor/preferences`, browser
  SDK interceptor, and a unified `login()` / `register()` flow that picks
  `/api/auth/...` on adapter-node and the SDK directly on adapter-static.
- `/api/auth/{login,register,logout}` JSON endpoints for the SSR web path.
- Backend `dependencies/auth.py` with `CurrentUser` / `CurrentSettings`,
  `exceptions.py` with a unified error envelope and request id, and
  `logging_config.py` for JSON logging + an `X-Request-ID` middleware.
- `BackgroundTasks`-scheduled email for group invites.
- `app/scripts/dump_openapi.py` writes `backend/openapi.json` without a
  running server; the frontend generator reads the snapshot.
- Repository scaffolding: `README.md`, `CONTRIBUTING.md`, `Justfile`,
  `docker-compose.yml`, `.editorconfig`, `.nvmrc`, GitHub Actions CI
  (backend, frontend, OpenAPI drift check), and a pre-commit config.
- Tests: backend integration tests for the email background task, the
  atomic-transaction rollback, and the exception envelope; vitest for
  `authStorage`.

### Changed

- FastAPI routers use `current_user: CurrentUser` instead of the previous
  `token + settings + get_current_user` preamble.
- `transactions.create_transaction` is now atomic: `flush()` for the
  generated id, single `commit()`, rollback on `SQLAlchemyError`.
- Response payloads use `model_validate(from_attributes=True)` instead of
  `model_construct`.
- `EmailConfirmationRequest` no longer accepts a `frontend_url` field; the
  backend uses `settings.FRONTEND_URL`.
- Frontend SDK reads `PUBLIC_BACKEND_URL` at runtime via `createClientConfig`
  instead of a hardcoded base URL.
- `auth.store` is a plain `writable` over the session user; the token lives
  in `authStorage`. `clientSideLogout()` POSTs `/api/auth/logout`, clears
  both transports, clears the query cache, and routes to login.
- `lib/shared/form/super-form.ts` defaults to SPA mode; forms call SDK
  mutations through TanStack Query and invalidate affected query keys.

### Removed

- Legacy `lib/shared/app/` (`controller.ts`, `persistentStore.ts`,
  `preferences.ts`).
- `lib/server/{hooks/cors.ts,layout-data.ts}`.
- `lib/shared/stores/{groups,balances,transactions}.store.ts`.
- All `+page.server.ts` / `+layout.server.ts` files under `routes/`.
- `csrf.checkOrigin = false` override in `svelte.config.js`.

### Fixed

- `groups.store.clear()` and `balances.store.clear()` returned the method
  reference instead of calling it (before the stores were removed).
- The shared SDK client's request interceptor was mutated per request on SSR,
  leaking tokens across concurrent requests.
- The transaction edit dialog bound to fields that did not exist on the
  backend model; rebuilt against the real `TransactionRead` shape.
