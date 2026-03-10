"""
Plot routes: validate polygon and associate with a project.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.v1.routes.auth import get_current_user
from backend.database import get_db
from backend.engines.geometry.engine import GeometryEngine
from backend.models import Plot, Project, User

router = APIRouter(prefix="/projects", tags=["plots"])
_geo = GeometryEngine()


# ── Schemas ────────────────────────────────────────────────────────────────


class PlotCreate(BaseModel):
    vertices: list[list[float]]  # [[x,y], ...]
    setback_m: float = 1.0
    setback_config: dict | None = None  # {front, rear, left, right}
    gate_direction: str = "south"


class PlotOut(BaseModel):
    id: str
    project_id: str
    vertices: list
    area_sqm: float | None
    perimeter_m: float | None
    bounding_box: dict | None
    centroid: dict | None
    buildable_vertices: list | None
    buildable_area_sqm: float | None
    setback_m: float
    is_valid: bool
    validation_issues: list


# ── Helpers ────────────────────────────────────────────────────────────────


def _plot_out(p: Plot) -> PlotOut:
    return PlotOut(
        id=str(p.id),
        project_id=str(p.project_id),
        vertices=p.vertices,
        area_sqm=p.area_sqm,
        perimeter_m=p.perimeter_m,
        bounding_box=p.bounding_box,
        centroid=p.centroid,
        buildable_vertices=p.buildable_vertices,
        buildable_area_sqm=p.buildable_area_sqm,
        setback_m=p.setback_m,
        is_valid=p.is_valid,
        validation_issues=p.validation_issues or [],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post("/{project_id}/plot", response_model=PlotOut)
async def set_plot(
    project_id: str,
    body: PlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify project ownership
    proj_result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate polygon geometry
    try:
        validation = _geo.validate_polygon_dict(body.vertices)
        buildable = _geo.compute_buildable_area(body.vertices, body.setback_m)

        from shapely.geometry import Polygon as ShapelyPolygon
        poly = ShapelyPolygon(body.vertices)
        bbox = poly.bounds  # (minx, miny, maxx, maxy)
        centroid = poly.centroid

        issues: list[str] = []
        is_valid = True
        if not validation.get("is_valid", True):
            issues = validation.get("issues", [])
            is_valid = False

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Polygon validation error: {e}")

    # Upsert plot
    existing = await db.execute(select(Plot).where(Plot.project_id == uuid.UUID(project_id)))
    plot = existing.scalar_one_or_none()

    if plot is None:
        plot = Plot(project_id=uuid.UUID(project_id))
        db.add(plot)

    plot.vertices = body.vertices
    plot.setback_m = body.setback_m
    plot.setback_config = body.setback_config or {"front": body.setback_m, "rear": body.setback_m, "left": body.setback_m, "right": body.setback_m}
    plot.area_sqm = round(poly.area, 2)
    plot.perimeter_m = round(poly.length, 2)
    plot.bounding_box = {"min_x": bbox[0], "min_y": bbox[1], "max_x": bbox[2], "max_y": bbox[3]}
    plot.centroid = {"x": round(centroid.x, 2), "y": round(centroid.y, 2)}
    plot.buildable_vertices = [list(p) for p in buildable] if buildable else None
    plot.buildable_area_sqm = round(ShapelyPolygon(buildable).area, 2) if buildable else None
    plot.is_valid = is_valid
    plot.validation_issues = issues

    # Also update gate direction on project
    project.gate_direction = body.gate_direction

    await db.flush()
    await db.refresh(plot)
    return _plot_out(plot)


@router.get("/{project_id}/plot", response_model=PlotOut)
async def get_plot(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proj_result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Plot).where(Plot.project_id == uuid.UUID(project_id)))
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not set yet")
    return _plot_out(plot)
