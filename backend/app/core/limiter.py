"""Rate limiter for API (e.g. login). Optional: ohne slowapi läuft die App ohne Rate-Limiting."""
import uuid

from app.config import settings

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    def _rate_limit_key(request):
        """In test mode: unique key per request (deaktiviert Rate-Limit). Sonst: IP."""
        if settings.ENVIRONMENT == "test":
            return str(uuid.uuid4())
        return get_remote_address(request)

    limiter = Limiter(key_func=_rate_limit_key)
    RATE_LIMIT_ENABLED = True
except ImportError:
    RATE_LIMIT_ENABLED = False

    class _DummyLimiter:
        """No-op Limiter wenn slowapi nicht installiert ist."""

        def limit(self, *args, **kwargs):
            def decorator(f):
                return f
            return decorator

    limiter = _DummyLimiter()
