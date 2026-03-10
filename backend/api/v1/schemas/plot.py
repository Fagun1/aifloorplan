from typing import Literal

from pydantic import AliasChoices, Field

from backend.api.v1.schemas.common import APIModel, BBox

GateDirection = Literal["north", "south", "east", "west"]


class PlotIn(APIModel):
    points: list[tuple[float, float]] = Field(
        min_length=3,
        validation_alias=AliasChoices("points", "vertices"),
    )
    gate_direction: GateDirection | str = "south"
    road_adjacency: list[str] = Field(default_factory=list)


class PlotOut(APIModel):
    points: list[tuple[float, float]]
    gate_direction: str
    area_m2: float
    bbox: BBox
    is_valid: bool


