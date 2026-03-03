"""Building-level and floor-level abstractions for multi-floor skeleton."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Tuple

from backend.engines.layout.models import Door


@dataclass
class Stair:
    id: str
    position: Tuple[float, float]
    width: float
    height: float
    connects_floors: Tuple[int, int]


@dataclass
class FloorLayout:
    floor_number: int
    rooms: list
    doors: List[Door]
    stairs: List[Stair] = field(default_factory=list)
    buildable_polygon: object = None


@dataclass
class BuildingCandidate:
    id: str
    floors: List[FloorLayout]
    building_score: float | None = None
