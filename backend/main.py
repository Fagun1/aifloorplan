from fastapi import FastAPI

from backend.api.v1.routes.layouts import router as layouts_router
from backend.api.v1.routes.plots import router as plots_router


def create_app() -> FastAPI:
    app = FastAPI(title="Phase 1 Layout Backend", version="0.1.0")
    app.include_router(plots_router, prefix="/api/v1")
    app.include_router(layouts_router, prefix="/api/v1")
    return app


app = create_app()

