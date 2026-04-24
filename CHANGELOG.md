# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

End-to-end refactor that collapses the old "every data route written three
times" architecture (`+page.server.ts` load + mirrored action + client-side
`onMount → onPageLoad`) onto a single universal-loader + TanStack Query data
layer, with forms in SPA mode. Web (SSR, adapter-node) and Capacitor
(adapter-static) now share one code path.

### Added

#### Frontend — data layer
- `lib/query/client.ts`: `createQueryClient()` — per-request on SSR, singleton
  in the browser. Root `+layout.ts` + `+layout.svelte` wire it into
  `QueryClientProvider` with SSR dehydration.
- `lib/query/options.ts`: shared `xxxQueryOptions(id)` helpers used by both
  universal loaders and components so dehydrate/hydrate shape stays identical.
- Universal `+page.ts` / `+layout.ts` loaders for every app route (account,
  dashboard, groups list, group dashboard + history + settings, auth
  login/register, group create, invite).
- `hooks.server.ts` wraps `event.fetch` so SSR universal loaders that hit
  `PUBLIC_BACKEND_URL` automatically carry the Bearer token — loaders don't
  plumb the token themselves.

#### Frontend — auth
- `lib/shared/auth/storage.ts`: `authStorage` over `@capacitor/preferences` for
  the token (unified across web + native).
- `lib/shared/auth/interceptor.ts`: `installAuthInterceptor()` on the shared
  browser SDK client; called once from `hooks.client.ts`.
- `lib/shared/auth/flows.ts`: unified `login()` / `register()` that pick
  `/api/auth/...` on adapter-node and the direct SDK on adapter-static.
- `lib/shared/auth/guards.ts`: `redirectUnauthenticated()` helper.
- `lib/server/api.ts`: `createServerApiClient({ fetch, token })` factory —
  per-request SSR SDK, fixes the old shared-client interceptor race.
- `/api/auth/{login,register,logout}` JSON endpoints for the SSR web path
  (mark `prerender = false` so the static build skips them).

#### Backend
- `app/dependencies/auth.py`: `CurrentUser` / `CurrentSettings` `Annotated`
  dependency types.
- `app/exceptions.py`: unified handlers for `HTTPException`,
  `RequestValidationError`, `SQLAlchemyError`, unhandled `Exception`. All
  responses carry a `request_id`.
- `app/logging_config.py`: JSON logging via `python-json-logger` +
  `RequestIdMiddleware` that binds a uuid4 into a contextvar and echoes it
  on the `X-Request-ID` header.
- `app/scripts/dump_openapi.py`: writes `backend/openapi.json` from the
  FastAPI app without running a server.
- `CORSMiddleware` with Capacitor origins (`capacitor://localhost`,
  `http://localhost`) + configured frontend URL.
- `EmailService.send_group_invite(...)`; invite-by-email schedules it via
  `BackgroundTasks` instead of a TODO.

#### Repository
- Root `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `Justfile`,
  `docker-compose.yml`, `.editorconfig`, `.nvmrc`.
- `.github/workflows/ci.yml`: backend (ruff + pytest), frontend (lint + check
  + unit), and an `api-drift` job that regenerates the OpenAPI snapshot + the
  typed client and fails on diff.
- `.pre-commit-config.yaml`: ruff + prettier + local api-drift hook (skips
  cleanly when the environment isn't ready).
- Committed `backend/openapi.json` snapshot; `openapi-ts.config.ts` reads the
  snapshot, not a live backend.

#### Tests
- Backend (pytest): `test_invite_by_email_sends_email`,
  `test_create_transaction_rolls_back_on_participant_failure`,
  `test_exceptions.py` (envelope contract, request_id echo). +5 tests → 70
  total, all passing.
- Frontend (vitest): `lib/shared/auth/storage.test.ts` round-trips
  `authStorage` over a mocked `@capacitor/preferences`.

### Changed
- **Every FastAPI router** collapses its 3-line `token + settings +
  get_current_user` preamble to `current_user: CurrentUser` (16+ sites).
- `transactions.create_transaction` is atomic — `session.flush()` for the
  generated id, a single `commit()`, `rollback()` + 500 on `SQLAlchemyError`.
  Previously an error mid-participant-loop orphaned Transaction rows.
- Response payloads use `model_validate(from_attributes=True)` instead of
  `model_construct` (which skipped validation entirely).
- `EmailConfirmationRequest` drops the ignored `frontend_url` field — the
  backend uses `settings.FRONTEND_URL`.
- Frontend SDK no longer hardcodes `baseUrl`; reads `PUBLIC_BACKEND_URL` via
  `createClientConfig` at runtime.
- `hooks.server.ts` rewritten: per-request SDK client in `event.locals.api`
  instead of mutating a module-scoped interceptor (concurrency bug fixed).
- `auth.store` shrunk to a plain `writable` over `{ user }`; the token lives
  in `authStorage`; `meQuery` drives user state. `clientSideLogout()` POSTs
  `/api/auth/logout`, clears both transports, clears the query cache, and
  routes to login.
- `lib/shared/form/super-form.ts` defaults to `SPA: true`. Every migrated
  form (account ×4, group create, group settings ×5, login, register,
  dashboard-layout rename, invite accept, add/edit transaction dialogs) calls
  a TanStack Query mutation via `onUpdate` and invalidates affected query
  keys.
- `svelte.config.js` drops the `csrf.checkOrigin = false` override — no
  cross-origin form POSTs remain.
- Login page: removed the 200+-LOC manual server switcher.
- `add-transaction-dialog` / `edit-transaction-dialog`: dropped SuperForms and
  the SvelteKit action they posted to; both now call the generated SDK via
  `createMutation` and invalidate balances + transactions queries on success.

### Removed
- `lib/shared/app/` (`controller.ts`, `persistentStore.ts`, `preferences.ts`)
  — `isCompiledStatic` branches and the fake-HTTP action proxy are gone.
- `lib/server/hooks/cors.ts`, `lib/server/layout-data.ts`.
- `lib/shared/stores/{groups,balances,transactions}.store.ts` — TanStack
  Query owns cached server state.
- **Every** `+page.server.ts` / `+layout.server.ts` under `routes/`.
- `routes/page.svelte.test.ts` — imported a `+page.svelte` that never existed
  at the repo root; had been failing since before this branch.

### Fixed
- `groups.store.clear()` and `balances.store.clear()` returned the method
  reference instead of calling it (before the stores were deleted entirely).
- SSR interceptor mutation leaked tokens across concurrent requests.
- `edit-transaction-dialog` was bound to `description`, `from`, `to` fields
  that don't exist on the backend model and POSTed to a fictional
  `/api/transactions/{id}` endpoint. Rebuilt against the real
  `TransactionRead` shape.
- `mocks/handlers/transactions.ts` `getTotalTransactionsMock` referenced an
  undefined `request`.

### Verification
- `svelte-check`: 0 errors (from 49 before this branch).
- `pnpm build:node` and `pnpm build:static` both succeed.
- backend `pytest -q`: 70 passed. frontend `vitest --run`: 3 passed.
- `grep -r 'isCompiledStatic\|onPageLoad\|onLayoutLoad\|triggerAction\|createCustomRequestForFormAction' frontend/src` → 0 hits.
- `find frontend/src/routes -name '+page.server.ts' -o -name '+layout.server.ts'` → 0 hits.
