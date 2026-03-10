"""
Async SQLAlchemy database engine.

- Production: Neon/Postgres via asyncpg
- Local dev: SQLite via aiosqlite (optional)
"""
from __future__ import annotations

import ssl
from urllib.parse import parse_qs, urlparse

from sqlalchemy import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.config.settings import get_settings


class Base(DeclarativeBase):
    pass


def _build_engine_args(raw_url: str):
    """
    Parse the raw DATABASE_URL (which may be postgres:// or postgresql+asyncpg://)
    and return (sqlalchemy_url, connect_args) suitable for asyncpg.

    asyncpg does NOT accept sslmode/channel_binding as DSN params or kwargs,
    so we strip them and pass an ssl.SSLContext via connect_args.
    """
    # Local dev SQLite support (no network/DNS needed)
    if raw_url.startswith("sqlite"):
        return raw_url, {
            "connect_args": {"check_same_thread": False},
            "pool_pre_ping": False,
            "pool_size": 1,
            "max_overflow": 0,
        }

    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    sslmode = params.get("sslmode", [None])[0]
    needs_ssl = sslmode in ("require", "verify-ca", "verify-full", "prefer")

    # Build a clean SQLAlchemy URL object — no query params that asyncpg rejects
    host_port = parsed.netloc.split("@")[-1]  # host:port or host
    if ":" in host_port:
        host, port_str = host_port.rsplit(":", 1)
        port = int(port_str)
    else:
        host = host_port
        port = 5432

    userinfo = parsed.netloc.split("@")[0] if "@" in parsed.netloc else ""
    if ":" in userinfo:
        username, password = userinfo.split(":", 1)
    else:
        username, password = userinfo, None

    database = parsed.path.lstrip("/")

    sa_url = URL.create(
        drivername="postgresql+asyncpg",
        username=username or None,
        password=password or None,
        host=host,
        port=port,
        database=database,
    )

    connect_args: dict = {}
    if needs_ssl:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ctx

    return sa_url, {
        "connect_args": connect_args,
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    }


def _make_engine():
    settings = get_settings()
    raw_url = settings.database_url
    if not raw_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to backend/.env\n"
            "Example: postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
        )

    sa_url, engine_kwargs = _build_engine_args(raw_url)
    return create_async_engine(sa_url, echo=False, **engine_kwargs)


_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = _make_engine()
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _session_factory


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async DB session."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def create_tables():
    """Create all tables on startup (idempotent)."""
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
