"""Observability setup: Sentry error tracking + Prometheus metrics."""

import logging
import time
from functools import wraps
from typing import Callable, Optional

import sentry_sdk
from fastapi import FastAPI, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger("boso_jawa.observability")

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

REQUEST_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "HTTP requests currently being processed",
    ["method", "endpoint"],
)

AI_TOKEN_USAGE = Counter(
    "ai_tokens_total",
    "Total AI tokens used",
    ["model", "type"],  # type: prompt, completion, total
)

AI_REQUEST_COUNT = Counter(
    "ai_requests_total",
    "Total AI requests",
    ["model", "status"],  # status: success, error, rate_limited
)

AI_LATENCY = Histogram(
    "ai_request_duration_seconds",
    "AI request latency in seconds",
    ["model"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

DB_QUERY_LATENCY = Histogram(
    "db_query_duration_seconds",
    "Database query latency in seconds",
    ["operation"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

ERROR_COUNT = Counter(
    "errors_total",
    "Total errors",
    ["type", "endpoint"],
)


def init_sentry() -> None:
    """Initialize Sentry SDK if DSN is configured."""
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.sentry_environment,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            profiles_sample_rate=settings.sentry_profiles_sample_rate,
            send_default_pii=False,
            attach_stacktrace=True,
            max_breadcrumbs=50,
            debug=settings.sentry_environment == "development",
        )
        logger.info("Sentry initialized", extra={"environment": settings.sentry_environment})
    else:
        logger.info("Sentry DSN not configured, skipping Sentry initialization")


def init_prometheus(app: FastAPI) -> None:
    """Add Prometheus metrics endpoint."""
    if not settings.prometheus_metrics_enabled:
        return

    @app.get(settings.prometheus_metrics_path, include_in_schema=False)
    async def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    logger.info("Prometheus metrics endpoint added", extra={"path": settings.prometheus_metrics_path})


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics for HTTP requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        method = request.method
        path = request.url.path

        # Normalize path for metrics (avoid high cardinality)
        endpoint = self._normalize_path(path)

        REQUEST_IN_PROGRESS.labels(method=method, endpoint=endpoint).inc()
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as e:
            status_code = 500
            ERROR_COUNT.labels(type=type(e).__name__, endpoint=endpoint).inc()
            raise
        finally:
            duration = time.perf_counter() - start_time
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            REQUEST_IN_PROGRESS.labels(method=method, endpoint=endpoint).dec()

    @staticmethod
    def _normalize_path(path: str) -> str:
        """Normalize path to avoid high cardinality in metrics."""
        # Replace IDs and UUIDs with placeholders
        import re
        path = re.sub(r"/\d+", "/:id", path)
        path = re.sub(
            r"/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
            "/:uuid",
            path,
        )
        return path


def record_ai_tokens(model: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Record AI token usage."""
    AI_TOKEN_USAGE.labels(model=model, type="prompt").inc(prompt_tokens)
    AI_TOKEN_USAGE.labels(model=model, type="completion").inc(completion_tokens)
    AI_TOKEN_USAGE.labels(model=model, type="total").inc(prompt_tokens + completion_tokens)


def record_ai_request(model: str, status: str, duration: float) -> None:
    """Record AI request metrics."""
    AI_REQUEST_COUNT.labels(model=model, status=status).inc()
    AI_LATENCY.labels(model=model).observe(duration)


def record_db_query(operation: str, duration: float) -> None:
    """Record database query latency."""
    DB_QUERY_LATENCY.labels(operation=operation).observe(duration)


def record_error(error_type: str, endpoint: str) -> None:
    """Record error occurrence."""
    ERROR_COUNT.labels(type=error_type, endpoint=endpoint).inc()


def capture_exception(exc: Exception, context: Optional[dict] = None) -> None:
    """Capture exception to Sentry with optional context."""
    if settings.sentry_dsn:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(exc)
    logger.exception(
        "Exception captured",
        extra={"error_type": type(exc).__name__, "context": context or {}},
    )


def capture_message(message: str, level: str = "info", context: Optional[dict] = None) -> None:
    """Capture message to Sentry."""
    if settings.sentry_dsn:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level=level)
    logger.log(
        getattr(logging, level.upper()),
        message,
        extra={"context": context or {}},
    )


def observe_ai_latency(model: str):
    """Decorator to observe AI request latency."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                duration = time.perf_counter() - start
                record_ai_request(model, "success", duration)
                return result
            except Exception as e:
                duration = time.perf_counter() - start
                status = "rate_limited" if "rate limit" in str(e).lower() else "error"
                record_ai_request(model, status, duration)
                capture_exception(e, {"model": model, "function": func.__name__})
                raise
        return wrapper
    return decorator


def observe_db_latency(operation: str):
    """Decorator to observe database query latency."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.perf_counter() - start
                record_db_query(operation, duration)
        return wrapper
    return decorator


async def lifespan_observability(app: FastAPI) -> None:
    """Initialize observability on startup."""
    init_sentry()
    init_prometheus(app)
    yield
    # Shutdown: flush Sentry
    if settings.sentry_dsn:
        sentry_sdk.flush(timeout=2.0)