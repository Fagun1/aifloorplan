from pydantic import AliasChoices, Field

from backend.api.v1.schemas.common import APIModel, BBox, ScoreBreakdown
from backend.api.v1.schemas.plot import PlotIn
from backend.api.v1.schemas.room import RoomSpec


class StructuredQuestionOut(APIModel):
    """Structured question for dynamic question engine (JSON output)."""

    id: str
    text: str
    type: str = "single_choice"
    options: list[str] = Field(default_factory=list)
    default: str | None = None
    category: str = ""
    why_it_matters: str = ""
    constraint_impact: list[str] = Field(default_factory=list)
    priority: int = 3


class GenerateLayoutsRequest(APIModel):
    plot: PlotIn
    rooms: list[RoomSpec] = Field(min_length=1)
    setback_m: float = Field(default=0.0, ge=0.0)
    num_candidates: int = Field(default=5, ge=1, le=50)
    generation_seed: int = Field(default=42, validation_alias=AliasChoices("generation_seed", "seed"))
    user_answers: dict[str, str | int | float | bool] | None = Field(default=None, description="Answers to pending questions (question_id -> value)")
    last_score_breakdown: dict[str, float] | None = Field(default=None, description="Optional dimension_scores from previous run for gap analysis")
    num_floors: int = Field(default=1, ge=1, description="Number of floors; 1 = single-floor (no building wrapper)")


class RoomPlacement(APIModel):
    name: str
    category: str
    target_area: float
    area_m2: float
    centroid: tuple[float, float]
    polygon: list[tuple[float, float]]


class DoorModel(APIModel):
    id: str
    room_a: str
    room_b: str | None = None
    position: tuple[float, float]
    angle: float
    width: float = 0.9
    floor_number: int = 0


class LayoutCandidate(APIModel):
    candidate_id: int
    rooms: list[RoomPlacement]
    adjacency: list[tuple[str, str]]
    adjacency_matrix: dict[str, list[str]]
    circulation_paths: list[list[tuple[float, float]]]
    doors: list[DoorModel] = Field(default_factory=list)
    bbox: BBox
    scores: ScoreBreakdown


class GenerateLayoutsResponse(APIModel):
    plot_area_m2: float
    plot_bbox: BBox
    buildable_area_m2: float
    buildable_bbox: BBox
    buildable_polygon: list[tuple[float, float]]
    candidates: list[LayoutCandidate]
    pending_questions: list[StructuredQuestionOut] = Field(default_factory=list, description="If non-empty, client should collect answers before layout generation")


class ImproveLayoutRequest(APIModel):
    layout: LayoutCandidate
    iterations: int = Field(default=50, ge=1, le=1000)
    mutation_strength: float = Field(default=0.5, ge=0.0, le=1.0)
    generation_seed: int | None = None
    gate_direction: str = "south"


class ImproveLayoutResponse(APIModel):
    improved_layout: LayoutCandidate
    original_score: ScoreBreakdown
    improved_score: ScoreBreakdown
    score_delta: float


class AnalyzeLayoutRequest(APIModel):
    layout: LayoutCandidate
    gate_direction: str = "south"


class AnalyzeLayoutResponse(APIModel):
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    architectural_notes: list[str]


class ExplainImprovementRequest(APIModel):
    original_layout: LayoutCandidate
    improved_layout: LayoutCandidate
    gate_direction: str = "south"


class ExplainImprovementResponse(APIModel):
    summary: str
    key_changes: list[str]
    why_score_improved: list[str]
    tradeoffs: list[str]
    rooms_most_affected: list[str]

