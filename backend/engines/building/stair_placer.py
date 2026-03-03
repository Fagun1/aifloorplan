"""Minimal deterministic stair placement skeleton."""

from __future__ import annotations

from backend.engines.building.models import BuildingCandidate, FloorLayout, Stair


class StairPlacer:
    """Place stairs at entrance room centroid on floor 0. No optimization."""

    def place_stairs(self, building: BuildingCandidate) -> None:
        """
        Deterministic: use floor 0 entrance room centroid as stair XY.
        Add one Stair per adjacent floor pair to both floors.
        """
        if not building.floors:
            return
        if len(building.floors) == 1:
            return

        floor0 = building.floors[0]
        entrance_room_name = self._entrance_room_name(floor0)
        x, y = self._stair_position_floor0(floor0, entrance_room_name)

        for i in range(len(building.floors) - 1):
            stair = Stair(
                id=f"stair_{i}_{i + 1}",
                position=(x, y),
                width=1.0,
                height=3.0,
                connects_floors=(i, i + 1),
            )
            building.floors[i].stairs.append(stair)
            building.floors[i + 1].stairs.append(stair)

    def _entrance_room_name(self, floor0: FloorLayout) -> str | None:
        """Room with exterior door (room_b is None). Deterministic."""
        for d in floor0.doors:
            if d.room_b is None:
                return d.room_a
        return None

    def _stair_position_floor0(self, floor0: FloorLayout, entrance_room_name: str | None) -> tuple[float, float]:
        """Stair position = entrance room centroid; fallback = first room centroid."""
        if entrance_room_name and floor0.rooms:
            for r in floor0.rooms:
                if r.name == entrance_room_name:
                    c = r.polygon.centroid
                    return (float(c.x), float(c.y))
        if floor0.rooms:
            c = floor0.rooms[0].polygon.centroid
            return (float(c.x), float(c.y))
        return (0.0, 0.0)
