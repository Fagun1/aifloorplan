"""
WebSocket editor endpoint: real-time room editing sync and rescoring.
Message protocol:
  client → server: { type, payload }
    - room_move      : { room_name, polygon, centroid }
    - room_resize    : { room_name, polygon }
    - room_add       : { room_spec: {name, category, target_area_sqm} }
    - room_delete    : { room_name }
    - floor_switch   : { floor_number }
    - request_rescore: { candidate }

  server → client: { type, payload }
    - score_update   : { scores, dimension_scores }
    - constraint_update: { violations: [{room_name, rules}] }
    - layout_sync    : { candidate }
    - error          : { message }
"""
from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.api.v1.dependencies import get_scoring_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/editor/{project_id}")
async def ws_editor(websocket: WebSocket, project_id: str):
    """WebSocket for the interactive 2D layout editor."""
    await websocket.accept()
    logger.info(f"WS editor connected: project={project_id}")
    scoring = get_scoring_engine()

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "payload": {"message": "Invalid JSON"}}))
                continue

            msg_type = msg.get("type")
            payload: dict[str, Any] = msg.get("payload", {})

            # ── request_rescore ─────────────────────────────────────────
            if msg_type == "request_rescore":
                candidate_data = payload.get("candidate")
                if candidate_data:
                    try:
                        from backend.api.v1.schemas.layout import LayoutCandidate
                        candidate = LayoutCandidate.model_validate(candidate_data)
                        score_result = scoring.score(candidate)
                        await websocket.send_text(json.dumps({
                            "type": "score_update",
                            "payload": {
                                "scores": score_result.model_dump() if hasattr(score_result, "model_dump") else vars(score_result),
                            },
                        }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({"type": "error", "payload": {"message": str(e)}}))

            # ── room_move ───────────────────────────────────────────────
            elif msg_type == "room_move":
                room_name = payload.get("room_name")
                violations = _check_basic_constraints(payload)
                await websocket.send_text(json.dumps({
                    "type": "constraint_update",
                    "payload": {"violations": violations, "room_name": room_name},
                }))

            # ── floor_switch ────────────────────────────────────────────
            elif msg_type == "floor_switch":
                floor_number = payload.get("floor_number", 0)
                await websocket.send_text(json.dumps({
                    "type": "floor_switched",
                    "payload": {"floor_number": floor_number},
                }))

            # ── ping / keepalive ────────────────────────────────────────
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "payload": {}}))

            else:
                await websocket.send_text(json.dumps({"type": "error", "payload": {"message": f"Unknown message type: {msg_type}"}}))

    except WebSocketDisconnect:
        logger.info(f"WS editor disconnected: project={project_id}")


def _check_basic_constraints(payload: dict) -> list[dict]:
    """Quick client-side-friendly constraint check without full geometry engine."""
    violations = []
    polygon = payload.get("polygon", [])
    room_name = payload.get("room_name", "")
    buildable = payload.get("buildable_polygon", [])

    if polygon and buildable:
        from shapely.geometry import Polygon
        try:
            room_poly = Polygon(polygon)
            build_poly = Polygon(buildable)
            if not build_poly.contains(room_poly):
                violations.append({
                    "room_name": room_name,
                    "rules": ["outside_buildable_area"],
                })
        except Exception:
            pass

    return violations
