from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass(frozen=True)
class Door:
    id: str
    room_a: str
    room_b: Optional[str]  # None = exterior
    position: Tuple[float, float]
    angle: float
    width: float = 0.9
    floor_number: int = 0


