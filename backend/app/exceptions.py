"""Centralised FastAPI exception handlers.

Validation, database, and unhandled errors return a ``{"error": {...}}``
envelope with a ``request_id`` for correlation. ``HTTPException`` responses
keep their familiar FastAPI ``{"detail": ...}`` shape (existing tests + the
frontend SDK lean on this), but still include the request_id header.
"""

from __future__ import annotations

import logging
from contextvars import ContextVar

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def _envelope(message: str, type_: str, status_code: int, **extra) -> JSONResponse:
    payload = {
        "error": {
            "message": message,
            "type": type_,
            "request_id": request_id_ctx.get(),
            **extra,
        }
    }
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def _http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        headers = getattr(exc, "headers", None) or {}
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "request_id": request_id_ctx.get()},
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _envelope(
            "Validation failed", "validation_error", 422, errors=exc.errors()
        )

    @app.exception_handler(SQLAlchemyError)
    async def _sql(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("database error on %s %s", request.method, request.url.path)
        return _envelope("A database error occurred", "database_error", 500)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled exception on %s %s", request.method, request.url.path)
        return _envelope("Internal server error", "internal_error", 500)
