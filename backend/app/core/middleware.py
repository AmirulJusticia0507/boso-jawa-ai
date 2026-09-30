"""Custom ASGI middleware: security headers."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

CSP_DIRECTIVES = (
    "default-src 'self'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'none'; "
    "object-src 'none'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "style-src 'self' 'unsafe-inline'; "
    "script-src 'self'; "
    "connect-src 'self' https://griphubrouter.web.id https://api.bazaarlink.ai; "
    "media-src 'self' blob: data:; "
    "worker-src 'self' blob:; "
    "manifest-src 'self'; "
    "upgrade-insecure-requests"
)

PERMISSIONS_POLICY = (
    "accelerometer=(), autoplay=(self), camera=(), geolocation=(), "
    "gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
)

# Paths that must never be framed or cached by intermediaries.
_CACHEABLE_PREFIXES = ("/assets/", "/static/", "/sw.js", "/manifest.webmanifest", "/icons/")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Tambahkan security header ke setiap response."""

    def __init__(self, app, *, hsts: bool = True) -> None:
        super().__init__(app)
        self._hsts = hsts

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        headers = response.headers

        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        headers.setdefault("Permissions-Policy", PERMISSIONS_POLICY)
        headers.setdefault("Content-Security-Policy", CSP_DIRECTIVES)
        headers.setdefault(
            "Content-Security-Policy-Report-Only",
            "report-uri /csp-report; frame-ancestors 'none'",
        )
        # Kurangi informasi versi framework yang terekspos.
        headers.setdefault("X-Powered-By", "boso-jawa-ai")
        if not headers.get("X-Powered-By"):
            del headers["X-Powered-By"]

        if self._hsts and request.url.scheme in ("https", "wss"):
            headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload",
            )

        if request.url.path.startswith(_CACHEABLE_PREFIXES):
            headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        else:
            headers.setdefault("Cache-Control", "no-store")

        return response
