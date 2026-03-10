"""
Floor-specific API routes.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.v1.routes.auth import get_current_user
from backend.database import get_db
from backend.models import Layout, Project, User

router = APIRouter(prefix="/projects", tags=["floors"])


class FloorOut(BaseModel):
    floor_number: int
    rooms: list[dict]
    doors: list[dict]
    total_area_sqm: float
    room_count: int


@router.get("/{project_id}/layouts/{layout_id}/floors", response_model=list[FloorOut])
async def list_floors(
    project_id: str,
    layout_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return per-floor room breakdowns for a given layout."""
    proj = await db.execute(select(Project).where(Project.id == uuid.UUID(project_id), Project.user_id == current_user.id))
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    layout_result = await db.execute(select(Layout).where(Layout.id == uuid.UUID(layout_id)))
    layout = layout_result.scalar_one_or_none()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")

    candidate = layout.candidate_data
    rooms = candidate.get("rooms", [])
    doors = candidate.get("doors", [])

    # Group by floor_number (currently all floor 0 unless multi-floor candidate)
    floors_map: dict[int, list] = {}
    for r in rooms:
        fn = r.get("floor_number", 0)
        floors_map.setdefault(fn, []).append(r)

    result = []
    for fn in sorted(floors_map.keys()):
        fn_rooms = floors_map[fn]
        fn_doors = [d for d in doors if d.get("floor_number", 0) == fn]
        result.append(FloorOut(
            floor_number=fn,
            rooms=fn_rooms,
            doors=fn_doors,
            total_area_sqm=round(sum(r.get("area_m2", 0) for r in fn_rooms), 2),
            room_count=len(fn_rooms),
        ))

    if not result:
        result = [FloorOut(floor_number=0, rooms=rooms, doors=doors,
                           total_area_sqm=round(sum(r.get("area_m2", 0) for r in rooms), 2),
                           room_count=len(rooms))]
    return result


@router.get("/{project_id}/layouts/{layout_id}/floors/{floor_number}", response_model=FloorOut)
async def get_floor(
    project_id: str,
    layout_id: str,
    floor_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_floors = await list_floors(project_id, layout_id, db, current_user)
    for f in all_floors:
        if f.floor_number == floor_number:
            return f
    raise HTTPException(status_code=404, detail="Floor not found")
