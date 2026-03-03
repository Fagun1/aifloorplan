"""Building-level generator: wraps single-floor layout into multi-floor skeleton."""

from __future__ import annotations

from shapely.geometry import Polygon

from backend.engines.building.models import BuildingCandidate, FloorLayout, Stair
from backend.engines.layout.generator import GeneratedRoom, Layout
from backend.engines.layout.models import Door


def _inset_polygon(poly: Polygon, margin: float) -> Polygon:
    """Deterministic inset; interior buffer. No randomness."""
    if margin <= 0 or poly.is_empty:
        return poly
    buffered = poly.buffer(-margin)
    return buffered if not buffered.is_empty else poly


class BuildingGenerator:
    """Structural skeleton: single floor or duplicated floors with inset buildable. No optimization."""

    def generate_building(
        self,
        base_layout: Layout,
        doors_floor0: list[Door],
        buildable_polygon: Polygon,
        num_floors: int,
        gate_direction: str,
    ) -> BuildingCandidate:
        """
        If num_floors == 1: return BuildingCandidate with single FloorLayout.
        If num_floors > 1: floor 0 uses base_layout; floors 1..N duplicate geometry, 0.5m inset for upper buildable.
        Deterministic; no mutation of base layout.
        """
        num_floors = max(1, int(num_floors))
        floors: list[FloorLayout] = []

        if num_floors == 1:
            floors.append(
                FloorLayout(
                    floor_number=0,
                    rooms=list(base_layout.rooms),
                    doors=list(doors_floor0),
                    stairs=[],
                    buildable_polygon=buildable_polygon,
                )
            )
            return BuildingCandidate(
                id=f"building_{base_layout.candidate_id}",
                floors=floors,
                building_score=None,
            )

        # Floor 0: base layout
        floors.append(
            FloorLayout(
                floor_number=0,
                rooms=list(base_layout.rooms),
                doors=list(doors_floor0),
                stairs=[],
                buildable_polygon=buildable_polygon,
            )
        )

        # Upper floors: duplicate rooms and doors; inset buildable by 0.5m
        upper_buildable = _inset_polygon(buildable_polygon, 0.5)
        for f in range(1, num_floors):
            # Copy rooms (same polygon references; no geometry mutation)
            rooms_f = [
                GeneratedRoom(name=r.name, category=r.category, target_area=r.target_area, polygon=r.polygon)
                for r in base_layout.rooms
            ]
            # Copy doors with floor_number = f
            doors_f = [
                Door(
                    id=d.id.replace("_0_", f"_{f}_") if "_0_" in d.id else f"{d.id}_f{f}",
                    room_a=d.room_a,
                    room_b=d.room_b,
                    position=d.position,
                    angle=d.angle,
                    width=d.width,
                    floor_number=f,
                )
                for d in doors_floor0
            ]
            floors.append(
                FloorLayout(
                    floor_number=f,
                    rooms=rooms_f,
                    doors=doors_f,
                    stairs=[],
                    buildable_polygon=upper_buildable,
                )
            )

        return BuildingCandidate(
            id=f"building_{base_layout.candidate_id}",
            floors=floors,
            building_score=None,
        )
