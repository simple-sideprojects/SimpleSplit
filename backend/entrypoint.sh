#!/bin/sh
set -e

# Run Alembic migrations
alembic upgrade head

# Start FastAPI app
exec fastapi run app/main.py
# exec uvicorn main:app --host 0.0.0.0 --port 8000 --no-server-header
