"""Rate limiter for API (e.g. login). Optional: ohne slowapi läuft die App ohne Rate-Limiting."""
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
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
