"""Application configuration using Pydantic Settings"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""

    DATABASE_URL: str = "sqlite:///./data/calendar.db"

    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3333"

    ENVIRONMENT: str = "development"

    # E-Mail (Microsoft 365 Business / SMTP)
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.office365.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "JuLis Kalender"
    APP_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def cors_allow_origin_regex(self) -> Optional[str]:
        """In development: allow local network origins (192.168.x.x, 10.x.x.x) for Handy-Zugriff"""
        if self.ENVIRONMENT != "development":
            return None
        return r"https?://(localhost|127\.0\.0\.1|frontend|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?"

    @property
    def email_configured(self) -> bool:
        """Check if email sending is properly configured"""
        return (
            self.SMTP_ENABLED
            and bool(self.SMTP_USER)
            and bool(self.SMTP_PASSWORD)
            and bool(self.SMTP_FROM_EMAIL)
        )


settings = Settings()
