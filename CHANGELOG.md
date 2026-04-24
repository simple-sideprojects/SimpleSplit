# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Universal `+page.ts` / `+layout.ts` loaders for every app route (account,
  dashboard, groups list, group dashboard + history + settings, auth
  login/register). SSR hydrates via TanStack Query; the static Capacitor
  build consumes the same queries through the browser client.
- `lib/query/options.ts`: shared `xxxQueryOptions(id)` helpers used by both
  loaders and components so dehydrate/hydrate shape stays identical.
- `lib/shared/auth/flows.ts`: unified `login(email, password)` /
  `register(...)` that picks `/api/auth/...` on adapter-node and the direct
  SDK on adapter-static; persists the token to `authStorage` in both cases.
- Per-request SSR fetch wrapper in `hooks.server.ts` that injects the Bearer
  header for any call to `PUBLIC_BACKEND_URL`, so universal loaders don't
  have to plumb the token themselves.

### Changed
- Every route form (account ×4, group create, group settings ×5, login,
  register, dashboard layout name edit, invite accept) runs SuperForms in
  `SPA: true` and calls an SDK mutation via TanStack Query; the wrapper in
  `lib/shared/form/super-form.ts` now defaults to SPA mode.
- `auth.store` is plain `writable` (no persistence) — the token lives in
  `authStorage`; `meQuery` drives user state. `clientSideLogout(queryClient)`
  POSTs `/api/auth/logout`, clears both transports, calls
  `queryClient.clear()`, and routes to login.
- `svelte.config.js` drops the `csrf.checkOrigin = false` override — no
  cross-origin form POSTs remain.
- Login page: removed the 200+-LOC manual server switcher (dead weight).

### Removed
- `frontend/src/lib/shared/app/` (controller.ts, persistentStore.ts,
  preferences.ts) — the legacy dual-path `isCompiledStatic` branches and the
  fake-HTTP action proxy are gone.
- `frontend/src/lib/server/layout-data.ts`,
  `frontend/src/lib/server/hooks/cors.ts`.
- `frontend/src/lib/shared/stores/{groups,balances,transactions}.store.ts`
  and their README. TanStack Query owns cached server state now.
- **Every** `+page.server.ts` / `+layout.server.ts` under `routes/`. Both
  transaction dialogs were rewritten to drop SuperForms entirely and call
  `createTransactionTransactionsPost` /
  `updateTransactionTransactionsTransactionIdPut` via TanStack Query
  mutations, invalidating balances + transaction queries on success. The
  edit dialog also stopped POSTing to the fictional
  `/api/transactions/{id}` endpoint with non-existent fields
  (`description`, `from`, `to`); it now binds to the real `TransactionRead`
  shape and pulls the group's member list via a TanStack Query.

### Other fixes
- `mocks/handlers/transactions.ts`: `getTotalTransactionsMock` was
  referencing an undefined `request` — added the destructure.
- `add-transaction-button`: `openDialog` ref promoted to `$state` so Svelte 5
  reactivity propagates the dialog handle the child binds back into.

### Result
- `svelte-check`: **0 errors**.
- `pnpm build:node` and `pnpm build:static` both succeed.
- backend pytest: 70 passed. frontend vitest: 3 passed.
- `grep -r 'isCompiledStatic\|onPageLoad\|onLayoutLoad\|triggerAction\|createCustomRequestForFormAction'` in `frontend/src` → 0 hits.
- `find frontend/src/routes -name '+page.server.ts' -o -name '+layout.server.ts'` → 0 hits.


- Root `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `Justfile`,
  `docker-compose.yml`, `.editorconfig`, `.nvmrc`.
- `.github/workflows/ci.yml`: backend (ruff + pytest), frontend (lint + check +
  unit), and an `api-drift` job that regenerates the OpenAPI snapshot and the
  typed client and fails on diff.
- `backend/app/scripts/dump_openapi.py` writes `backend/openapi.json`; the
  frontend generator reads that committed snapshot (no live backend required).
- `backend/app/dependencies/auth.py`: `CurrentUser` / `CurrentSettings`
  dependency types.
- `backend/app/exceptions.py`: unified handlers for `HTTPException`,
  `RequestValidationError`, `SQLAlchemyError`, unhandled `Exception`, with a
  `request_id` per response.
- `backend/app/logging_config.py`: JSON logging + `X-Request-ID` middleware.
- CORS middleware with Capacitor origins.
- `BackgroundTasks`-scheduled group invite email (`EmailService.send_group_invite`).
- Frontend `authStorage` (Capacitor Preferences), SDK auth interceptor, and
  per-request SSR SDK client (`lib/server/api.ts`).
- Universal `/api/auth/{login,register,logout}` JSON endpoints for the SSR
  web path.
- TanStack Query wiring at the root layout with SSR dehydration.

### Changed
- Every FastAPI router collapses its 3-line
  `token + settings + get_current_user` preamble to `current_user: CurrentUser`.
- `transactions.create_transaction` is now atomic (single `commit()`, rollback
  on `SQLAlchemyError`, `session.flush()` for the generated id).
- `UserResponse`/similar payloads use `model_validate(from_attributes=True)`
  instead of `model_construct` (which skipped validation entirely).
- `EmailConfirmationRequest` drops the ignored `frontend_url` field — the
  backend now always uses `settings.FRONTEND_URL`.
- Frontend SDK no longer hardcodes `baseUrl`; reads `PUBLIC_BACKEND_URL` via
  `createClientConfig` at runtime.
- `hooks.server.ts` rewritten: per-request SDK client in `event.locals.api`
  instead of mutating a module-scoped interceptor (race fixed).
- `auth.store` persisted shape drops `token` and `authenticated` (token lives
  in `authStorage`; session presence inferred from `user`).
- `clientSideLogout()` clears the balances store in addition to groups and
  transactions.

### Fixed
- `groups.store.clear()` and `balances.store.clear()` returned the method
  reference instead of calling it.
- SSR interceptor mutation leaked tokens across concurrent requests.
