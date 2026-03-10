"""
Main FastAPI application — complete platform with all routes.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v1.routes.auth import router as auth_router
from backend.api.v1.routes.floors import router as floors_router
from backend.api.v1.routes.layouts import router as layouts_router
from backend.api.v1.routes.plots import router as plots_router
from backend.api.v1.routes.projects import router as projects_router
from backend.api.v1.routes.vr import router as vr_router
from backend.api.v1.routes.ws_editor import router as ws_router
from backend.config.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.database_url:
        try:
            from backend.database import create_tables
            await create_tables()
        except Exception as e:
            import logging
            logging.warning(f"DB table creation skipped: {e}")
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AI Architectural Planning Platform",
        version="2.0.0",
        description="AI-powered floor plan generation, interactive editing, and VR walkthrough.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Development: expose full exception details in 500 responses
    import logging
    import traceback
    from fastapi import Request
    from fastapi.responses import JSONResponse

    logger = logging.getLogger("uvicorn.error")
    logging.basicConfig(level=logging.DEBUG)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        tb = traceback.format_exc()
        logger.error(f"Unhandled exception on {request.url}: {tb}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "traceback": tb},
        )


    # REST Routes
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(projects_router, prefix="/api/v1")
    app.include_router(plots_router, prefix="/api/v1")
    app.include_router(layouts_router, prefix="/api/v1")
    app.include_router(floors_router, prefix="/api/v1")
    app.include_router(vr_router, prefix="/api/v1")

    # WebSocket Routes
    app.include_router(ws_router)

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "version": "2.0.0"}

    return app


app = create_app()
