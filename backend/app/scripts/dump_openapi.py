"""Dump the FastAPI OpenAPI schema to ``backend/openapi.json``.

Used by the frontend generator (``pnpm generate:api``) and the
``api-drift`` CI job so the typed client never drifts from the backend
without a committed snapshot.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.main import app


def main() -> None:
    output = Path(__file__).resolve().parents[2] / "openapi.json"
    schema = app.openapi()
    output.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n")
    print(f"Wrote OpenAPI schema to {output}")


if __name__ == "__main__":
    main()
