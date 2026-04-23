"""Structured JSON logging + per-request correlation id."""

from __future__ import annotations

import logging
import uuid
from logging.config import dictConfig

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.exceptions import request_id_ctx


class RequestIdFilter(logging.Filter):
    """Injects the contextvar-scoped request id onto every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get() or "-"
        return True


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "request_id": {"()": RequestIdFilter},
    },
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(request_id)s %(message)s",
        },
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "filters": ["request_id"],
        },
    },
    "root": {
        "handlers": ["default"],
        "level": "INFO",
    },
}


def configure_logging() -> None:
    try:
        dictConfig(LOGGING_CONFIG)
    except ValueError:
        # python-json-logger not installed — fall back to plain logging
        logging.basicConfig(level=logging.INFO)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Accepts an incoming ``X-Request-ID`` header or mints a new uuid4, and
    propagates it via a contextvar + echoes it on the response."""

    def __init__(self, app: ASGIApp, header: str = "x-request-id") -> None:
        super().__init__(app)
        self.header = header

    async def dispatch(self, request: Request, call_next) -> Response:
        rid = request.headers.get(self.header) or uuid.uuid4().hex
        token = request_id_ctx.set(rid)
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        response.headers[self.header] = rid
        return response
