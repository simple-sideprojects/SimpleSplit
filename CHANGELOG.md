# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
