from fastapi import APIRouter, HTTPException

from backend.api.v1.dependencies import get_llm_assistant, get_local_search_optimizer, get_pipeline
from backend.api.v1.schemas.layout import (
    AnalyzeLayoutRequest,
    AnalyzeLayoutResponse,
    ExplainImprovementRequest,
    ExplainImprovementResponse,
    GenerateLayoutsRequest,
    GenerateLayoutsResponse,
    ImproveLayoutRequest,
    ImproveLayoutResponse,
)

router = APIRouter(tags=["layouts"])


@router.post("/layouts/generate", response_model=GenerateLayoutsResponse)
def generate_layouts(req: GenerateLayoutsRequest) -> GenerateLayoutsResponse:
    pipeline = get_pipeline()
    try:
        result = pipeline.execute(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return result


@router.post("/layouts/improve", response_model=ImproveLayoutResponse)
def improve_layout(req: ImproveLayoutRequest) -> ImproveLayoutResponse:
    optimizer = get_local_search_optimizer()
    layout = req.layout
    gate_direction = req.gate_direction
    iterations = req.iterations
    strength = req.mutation_strength
    generation_seed = req.generation_seed if req.generation_seed is not None else 42

    result = optimizer.improve(
        layout=layout,
        gate_direction=gate_direction,
        iterations=iterations,
        mutation_strength=strength,
        generation_seed=generation_seed,
    )

    original_score = layout.scores
    improved_score = result.improved_layout.scores

    return ImproveLayoutResponse(
        improved_layout=result.improved_layout,
        original_score=original_score,
        improved_score=improved_score,
        score_delta=float(improved_score.total - original_score.total),
    )


@router.post("/layouts/analyze", response_model=AnalyzeLayoutResponse)
def analyze_layout(req: AnalyzeLayoutRequest) -> AnalyzeLayoutResponse:
    assistant = get_llm_assistant()
    result = assistant.analyze(layout=req.layout, gate_direction=req.gate_direction)
    return AnalyzeLayoutResponse(
        summary=result.summary,
        strengths=result.strengths,
        weaknesses=result.weaknesses,
        suggestions=result.suggestions,
        architectural_notes=result.architectural_notes,
    )


@router.post("/layouts/explain-improvement", response_model=ExplainImprovementResponse)
def explain_improvement(req: ExplainImprovementRequest) -> ExplainImprovementResponse:
    assistant = get_llm_assistant()
    result = assistant.analyze_improvement(
        original=req.original_layout,
        improved=req.improved_layout,
        gate_direction=req.gate_direction,
    )
    return ExplainImprovementResponse(
        summary=result.summary,
        key_changes=result.key_changes,
        why_score_improved=result.why_score_improved,
        tradeoffs=result.tradeoffs,
        rooms_most_affected=result.rooms_most_affected,
    )

