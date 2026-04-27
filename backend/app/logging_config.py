"""Structured JSON logging + per-request correlation id."""

from __future__ import annotations

import logging
import uuid
from logging.config import dictConfig

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.exceptions import request_id_ctx

REQUEST_ID_HEADER = "x-request-id"


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
    """Honours an incoming ``X-Request-ID`` or mints a uuid4, propagates it
    via a contextvar, and echoes it on the response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        rid = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        token = request_id_ctx.set(rid)
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        response.headers[REQUEST_ID_HEADER] = rid
        return response
