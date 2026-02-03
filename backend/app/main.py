"""FastAPI application initialization and configuration"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.limiter import limiter, RATE_LIMIT_ENABLED
import logging

if RATE_LIMIT_ENABLED:
    from slowapi.errors import RateLimitExceeded
    from slowapi import _rate_limit_exceeded_handler

logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "development" else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JuLis Calendar Event Management API",
    description="API for managing calendar events with admin approval workflow",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)
if RATE_LIMIT_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_kwargs: dict = {
    "allow_origins": settings.cors_origins_list,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if settings.cors_allow_origin_regex:
    cors_kwargs["allow_origin_regex"] = settings.cors_allow_origin_regex
app.add_middleware(CORSMiddleware, **cors_kwargs)


DEFAULT_JWT_SECRET = "dev-secret-key-change-in-production"


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f"Starting Calendar API in {settings.ENVIRONMENT} mode")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    if settings.cors_allow_origin_regex:
        logger.info("CORS: local network origins (192.168.x.x, 10.x.x.x) allowed for dev")
    if not RATE_LIMIT_ENABLED:
        logger.warning("Rate limiting disabled (slowapi not installed). Install slowapi for login protection.")

    if settings.ENVIRONMENT == "production" and settings.JWT_SECRET_KEY == DEFAULT_JWT_SECRET:
        logger.warning(
            "JWT_SECRET_KEY is still the default value. Set a strong random secret in production!"
        )


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down Calendar API")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "JuLis Calendar Event Management API",
        "version": "1.0.0",
        "docs": "/api/docs" if settings.ENVIRONMENT == "development" else "disabled"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

from app.api.v1.api import api_router as api_v1_router
app.include_router(api_v1_router, prefix="/api/v1")
