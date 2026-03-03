from pydantic import BaseModel, Field, ConfigDict


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BBox(APIModel):
    min_x: float
    min_y: float
    max_x: float
    max_y: float


class Point2D(APIModel):
    x: float
    y: float


def points_to_xy(points: list[tuple[float, float]]) -> list[Point2D]:
    return [Point2D(x=float(x), y=float(y)) for x, y in points]


class ScoreBreakdown(APIModel):
    """Composite score [0, 100] with per-dimension scores [0, 1] and optional Pareto rank."""

    total: float = Field(ge=0.0, le=100.0, description="Weighted composite score minus penalties")
    dimension_scores: dict[str, float] = Field(
        default_factory=dict,
        description="Per-dimension normalized scores in [0, 1]",
    )
    pareto_rank: int | None = Field(default=None, description="Non-dominated front rank; 1 = best front")
    # Legacy fields for backward compatibility (derived from dimension_scores when present)
    space_utilization: float = Field(default=0.0, ge=0.0, le=1.0)
    natural_light: float = Field(default=0.0, ge=0.0, le=1.0)
    privacy: float = Field(default=0.0, ge=0.0, le=1.0)

