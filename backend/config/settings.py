"""
Application settings loaded from environment variables.
Searches for .env in backend/ dir first, then project root.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend/ directory (relative to this file)
_backend_dir = Path(__file__).parent.parent  # backend/
_env_file = _backend_dir / ".env"

if _env_file.exists():
    load_dotenv(_env_file, override=True)
else:
    # Fallback: project root
    load_dotenv(override=True)


def _fix_db_url(url: str) -> str:
    """Ensure asyncpg driver prefix for SQLAlchemy async engine."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


class Settings:
    # ── Database ──────────────────────────────────────────────────────────
    database_url: str = _fix_db_url(os.getenv("DATABASE_URL", ""))

    # ── LLM ───────────────────────────────────────────────────────────────
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))

    # ── Auth ──────────────────────────────────────────────────────────────
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

    # ── App ───────────────────────────────────────────────────────────────
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # ── Features ──────────────────────────────────────────────────────────
    enable_question_engine: bool = os.getenv("ENABLE_QUESTION_ENGINE", "true").lower() == "true"
    max_candidates: int = int(os.getenv("MAX_CANDIDATES_PER_GENERATION", "20"))
    max_floors: int = int(os.getenv("MAX_FLOORS", "20"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()
