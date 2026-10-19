import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "VPS Fleet Monitor"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = "insecure-secret-key-please-change-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Argon2id limits & rate limiting
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 10
    API_RATE_LIMIT_PER_MINUTE: int = 120
    ACCOUNT_LOCKOUT_ATTEMPTS: int = 10
    ACCOUNT_LOCKOUT_MINUTES: int = 5

    # Default Initial Admin
    FIRST_ADMIN_USERNAME: str = "admin"
    FIRST_ADMIN_EMAIL: str = "admin@fleet.local"
    FIRST_ADMIN_PASSWORD: str = "ChangeMe_FleetAdmin2026!"

    # Allowed CORS Origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:8000"

    # Database: Supports SQLite (aiosqlite) or PostgreSQL (asyncpg)
    DATABASE_URL: str = "sqlite+aiosqlite:///./fleet_monitor.db"

    # Monitoring Thresholds
    HEARTBEAT_INTERVAL_SECONDS: int = 15
    SERVER_DELAYED_THRESHOLD_SECONDS: int = 35
    SERVER_OFFLINE_THRESHOLD_SECONDS: int = 60
    METRIC_RETENTION_DAYS: int = 30

    # Optional Notification Integrations
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
