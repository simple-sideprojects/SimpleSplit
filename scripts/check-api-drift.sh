#!/usr/bin/env bash
# Regenerate the OpenAPI snapshot + the typed frontend client and fail if
# either would change. Used by CI and the pre-commit hook.
#
# In a CI environment ($CI is set) all output is shown and any missing
# toolchain is a hard failure. Locally (pre-commit) the script skips
# cleanly when the toolchain isn't ready so it doesn't block unrelated
# commits on a fresh clone.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
in_ci="${CI:-}"

require_or_skip() {
    local cmd=$1 name=$2
    if ! command -v "$cmd" >/dev/null 2>&1; then
        if [[ -n "$in_ci" ]]; then
            echo "error: $name not on PATH" >&2
            exit 1
        fi
        echo "skipped: $name not on PATH"
        exit 0
    fi
}

require_or_skip python python
require_or_skip pnpm pnpm

run_or_skip() {
    local label=$1
    shift
    if [[ -n "$in_ci" ]]; then
        "$@"
    elif ! "$@" >/dev/null 2>&1; then
        echo "skipped: $label failed locally"
        exit 0
    fi
}

run_or_skip "backend dump_openapi" \
    bash -c "cd '$repo_root/backend' && python -m app.scripts.dump_openapi"
run_or_skip "frontend generate:api" \
    bash -c "cd '$repo_root/frontend' && pnpm generate:api"

if ! git -C "$repo_root" diff --exit-code backend/openapi.json frontend/src/lib/client/; then
    cat <<'EOF' >&2

OpenAPI snapshot or generated client drifted from the FastAPI source.
Regenerate locally and commit the result:

    just generate-api
EOF
    exit 1
fi
