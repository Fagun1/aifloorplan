"""
VR Routes: serve 3D scene data for a layout candidate.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.v1.routes.auth import get_current_user
from backend.database import get_db
from backend.engines.vr.scene_builder import build_vr_scene
from backend.models import Layout, Project, User

router = APIRouter(prefix="/vr", tags=["vr"])


@router.get("/scene/{project_id}")
async def get_vr_scene(
    project_id: str,
    floor: int = 0,
    candidate_index: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the 3D VR scene for the best (or specified) layout candidate."""
    result = await db.execute(
        select(Project).where(
            Project.id == uuid.UUID(project_id),
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get layouts for this project
    layout_result = await db.execute(
        select(Layout).where(Layout.project_id == project.id)
    )
    layouts = layout_result.scalars().all()

    if not layouts:
        raise HTTPException(status_code=404, detail="No layouts found. Generate layouts first.")

    # Find selected or use first
    selected = next((l for l in layouts if l.is_selected), layouts[0])
    candidate = selected.candidate_data

    scene = build_vr_scene(candidate, floor_number=floor)
    return {
        "project_id": project_id,
        "layout_id": str(selected.id),
        "floor": floor,
        **scene,
    }


@router.get("/scene/{project_id}/rooms/{room_name}")
async def get_room_vr(
    project_id: str,
    room_name: str,
    floor: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return 3D data for a single room."""
    scene_data = await get_vr_scene(project_id, floor, 0, db, current_user)
    room = next(
        (r for r in scene_data["rooms"] if r["name"].lower() == room_name.lower()),
        None,
    )
    if not room:
        raise HTTPException(status_code=404, detail=f"Room '{room_name}' not found")
    return room
