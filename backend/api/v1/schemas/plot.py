from typing import Literal

from pydantic import Field

from backend.api.v1.schemas.common import APIModel, BBox

GateDirection = Literal["north", "south", "east", "west"]


class PlotIn(APIModel):
    points: list[tuple[float, float]] = Field(min_length=3)
    gate_direction: GateDirection = "south"


class PlotOut(APIModel):
    points: list[tuple[float, float]]
    gate_direction: GateDirection
    area_m2: float
    bbox: BBox
    is_valid: bool

