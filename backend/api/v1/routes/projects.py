"""
Project CRUD routes.
"""
from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.v1.dependencies import get_pipeline
from backend.api.v1.schemas.layout import GenerateLayoutsRequest
from backend.api.v1.schemas.plot import PlotIn
from backend.api.v1.schemas.room import RoomSpec
from backend.api.v1.routes.auth import get_current_user
from backend.database import get_db
from backend.models import Layout, Plot, Project, RoomRequirement, User

router = APIRouter(prefix="/projects", tags=["projects"])


# ── Schemas ────────────────────────────────────────────────────────────────


class RoomReqIn(BaseModel):
    name: str
    category: str = "private"
    target_area_sqm: float


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    num_floors: int = 1
    gate_direction: str = "south"
    road_adjacency: list[str] = []
    generation_seed: int = 42
    rooms: list[RoomReqIn] = []


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    num_floors: int | None = None
    gate_direction: str | None = None
    road_adjacency: list[str] | None = None
    generation_seed: int | None = None
    rooms: list[RoomReqIn] | None = None


class RoomReqOut(BaseModel):
    id: str
    name: str
    category: str
    target_area_sqm: float


class LayoutSummaryOut(BaseModel):
    id: str
    candidate_index: int
    is_selected: bool
    total_score: float | None
    dimension_scores: dict | None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None
    status: str
    num_floors: int
    gate_direction: str
    road_adjacency: list
    generation_seed: int
    rooms: list[RoomReqOut]
    layouts: list[LayoutSummaryOut]
    created_at: str
    updated_at: str


# ── Helpers ────────────────────────────────────────────────────────────────


def _project_out(p: Project) -> ProjectOut:
    return ProjectOut(
        id=str(p.id),
        name=p.name,
        description=p.description,
        status=p.status,
        num_floors=p.num_floors,
        gate_direction=p.gate_direction,
        road_adjacency=p.road_adjacency or [],
        generation_seed=p.generation_seed,
        rooms=[RoomReqOut(id=str(r.id), name=r.name, category=r.category, target_area_sqm=r.target_area_sqm) for r in (p.room_requirements or [])],
        layouts=[
            LayoutSummaryOut(
                id=str(l.id),
                candidate_index=l.candidate_index,
                is_selected=l.is_selected,
                total_score=l.total_score,
                dimension_scores=l.dimension_scores,
            )
            for l in (p.layouts or [])
        ],
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        num_floors=body.num_floors,
        gate_direction=body.gate_direction,
        road_adjacency=body.road_adjacency,
        generation_seed=body.generation_seed,
    )
    db.add(project)
    await db.flush()

    for r in body.rooms:
        req = RoomRequirement(project_id=project.id, name=r.name, category=r.category, target_area_sqm=r.target_area_sqm)
        db.add(req)

    await db.flush()
    await db.refresh(project)

    # Eagerly load relationships
    result = await db.execute(
        select(Project)
        .where(Project.id == project.id)
    )
    project = result.scalar_one()
    # Load relationships
    await db.refresh(project, ["room_requirements", "layouts"])

    return _project_out(project)


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    for p in projects:
        await db.refresh(p, ["room_requirements", "layouts"])
    return [_project_out(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.refresh(project, ["room_requirements", "layouts"])
    return _project_out(project)


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    if body.num_floors is not None:
        project.num_floors = body.num_floors
    if body.gate_direction is not None:
        project.gate_direction = body.gate_direction
    if body.road_adjacency is not None:
        project.road_adjacency = body.road_adjacency
    if body.generation_seed is not None:
        project.generation_seed = body.generation_seed

    if body.rooms is not None:
        # Replace all room requirements
        existing = await db.execute(select(RoomRequirement).where(RoomRequirement.project_id == project.id))
        for r in existing.scalars().all():
            await db.delete(r)
        await db.flush()
        for r in body.rooms:
            req = RoomRequirement(project_id=project.id, name=r.name, category=r.category, target_area_sqm=r.target_area_sqm)
            db.add(req)

    await db.flush()
    await db.refresh(project, ["room_requirements", "layouts"])
    return _project_out(project)


@router.get("/{project_id}/layouts")
async def get_project_layouts(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full candidate data (with room polygons) for all layouts of a project."""
    proj_result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    layouts_result = await db.execute(
        select(Layout).where(Layout.project_id == project.id).order_by(Layout.candidate_index)
    )
    layouts = layouts_result.scalars().all()
    return [
        {
            "id": str(l.id),
            "candidate_index": l.candidate_index,
            "is_selected": l.is_selected,
            "total_score": l.total_score,
            "dimension_scores": l.dimension_scores,
            "candidate_data": l.candidate_data,
        }
        for l in layouts
    ]

@router.post("/{project_id}/generate")
async def generate_project_layouts(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate layouts for a project using its saved plot and room requirements.
    Saves candidates to the DB. Returns generated candidate summaries.
    """
    # Load project
    proj_result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Load plot
    plot_result = await db.execute(select(Plot).where(Plot.project_id == project.id))
    plot = plot_result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=400, detail="No plot found. Draw a plot first.")

    # Load rooms
    rooms_result = await db.execute(select(RoomRequirement).where(RoomRequirement.project_id == project.id))
    rooms = rooms_result.scalars().all()
    if not rooms:
        raise HTTPException(status_code=400, detail="No room requirements found.")

    # Build request for pipeline
    plot_in = PlotIn(points=plot.vertices, gate_direction=project.gate_direction or "south")
    room_specs = [
        RoomSpec(name=r.name, category=r.category, target_area=r.target_area_sqm)
        for r in rooms
    ]

    # Pre-flight: check room-to-plot ratio before running expensive pipeline
    total_req = sum(float(r.target_area_sqm) for r in rooms)
    buildable_area = float(plot.buildable_area_sqm or plot.area_sqm or 0)
    if buildable_area > 0:
        ratio = total_req / buildable_area
        if ratio < 0.05:
            raise HTTPException(
                status_code=422,
                detail=f"Rooms total {total_req:.0f} m² is far too small for {buildable_area:.0f} m² buildable area ({ratio:.0%} utilization). Add at least {int(buildable_area * 0.15):.0f} m² more rooms."
            )
        if ratio > 1.1:
            raise HTTPException(
                status_code=422,
                detail=f"Rooms total {total_req:.0f} m² exceeds buildable area {buildable_area:.0f} m². Reduce room sizes or increase plot setback."
            )

    req = GenerateLayoutsRequest(
        plot=plot_in,
        rooms=room_specs,
        setback_m=float(plot.setback_m or 1.0),
        num_candidates=10,
        generation_seed=int(project.generation_seed or 42),
        user_answers={"_bypass": "true"},  # always bypass question wizard
        num_floors=int(project.num_floors or 1),
    )

    pipeline = get_pipeline()
    t0 = time.monotonic()
    try:
        result = pipeline.execute(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Layout generation failed: {e}") from e
    elapsed_ms = int((time.monotonic() - t0) * 1000)

    if not result.candidates:
        # Compute helpful diagnostics
        total_req = sum(float(r.target_area_sqm) for r in rooms)
        buildable = float(plot.buildable_area_sqm or plot.area_sqm or 0)
        ratio = total_req / buildable if buildable > 0 else 0
        if result.pending_questions:
            return {"status": "pending_questions", "pending_questions": [q.model_dump() for q in result.pending_questions]}
        if ratio < 0.1:
            hint = f"Rooms total {total_req:.0f} m² is very small for a {buildable:.0f} m² buildable area (ratio {ratio:.0%}). Add more rooms."
        elif ratio > 1.0:
            hint = f"Rooms total {total_req:.0f} m² exceeds buildable area {buildable:.0f} m². Reduce room sizes or increase setback."
        else:
            hint = "No valid layout could be generated. Try a different plot shape or more room variety."
        raise HTTPException(status_code=422, detail=hint)

    # Delete existing layouts for this project
    await db.execute(delete(Layout).where(Layout.project_id == project.id))

    # Save new layouts
    saved: list[dict] = []
    for i, c in enumerate(result.candidates):
        c_dict = c.model_dump()
        layout = Layout(
            project_id=project.id,
            candidate_index=i,
            is_selected=(i == 0),
            candidate_data=c_dict,
            total_score=float(c.scores.total) if c.scores else None,
            dimension_scores=c.scores.model_dump() if c.scores else None,
            generation_seed=int(project.generation_seed or 42),
            generation_time_ms=elapsed_ms // max(1, len(result.candidates)),
        )
        db.add(layout)
        saved.append({"candidate_index": i, "score": float(c.scores.total) if c.scores else None})

    project.status = "layout_ready"
    await db.flush()

    return {
        "status": "ok",
        "candidates": len(saved),
        "generation_time_ms": elapsed_ms,
        "layouts": saved,
    }


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
