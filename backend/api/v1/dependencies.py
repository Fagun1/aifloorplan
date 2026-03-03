from functools import lru_cache

from backend.engines.building import BuildingGenerator, StairPlacer, VerticalConstraintEngine
from backend.engines.constraints import ConstraintEngine
from backend.engines.geometry.engine import GeometryEngine
from backend.engines.layout.door_placer import DoorPlacer
from backend.engines.layout.generator import LayoutGenerator
from backend.engines.llm import LLMArchitecturalAssistant
from backend.engines.optimizer import LocalSearchOptimizer
from backend.engines.questions import QuestionEngine
from backend.engines.questions.answer_processor import AnswerProcessor
from backend.engines.orchestrator.pipeline import LayoutPipeline
from backend.engines.scoring.scorer import ScoringEngine


@lru_cache()
def get_geometry_engine() -> GeometryEngine:
    return GeometryEngine()


@lru_cache()
def get_layout_generator() -> LayoutGenerator:
    return LayoutGenerator()


@lru_cache()
def get_scoring_engine() -> ScoringEngine:
    return ScoringEngine()


@lru_cache()
def get_constraint_engine() -> ConstraintEngine:
    return ConstraintEngine()


@lru_cache()
def get_door_placer() -> DoorPlacer:
    return DoorPlacer()


@lru_cache()
def get_question_engine() -> QuestionEngine:
    return QuestionEngine()


@lru_cache()
def get_answer_processor() -> AnswerProcessor:
    return AnswerProcessor()


@lru_cache()
def get_building_generator() -> BuildingGenerator:
    return BuildingGenerator()


@lru_cache()
def get_stair_placer() -> StairPlacer:
    return StairPlacer()


@lru_cache()
def get_vertical_constraint_engine() -> VerticalConstraintEngine:
    return VerticalConstraintEngine()


@lru_cache()
def get_pipeline() -> LayoutPipeline:
    return LayoutPipeline(
        geometry=get_geometry_engine(),
        layout=get_layout_generator(),
        scoring=get_scoring_engine(),
        constraints=get_constraint_engine(),
        door_placer=get_door_placer(),
        question_engine=get_question_engine(),
        answer_processor=get_answer_processor(),
        building_generator=get_building_generator(),
        stair_placer=get_stair_placer(),
        vertical_constraints=get_vertical_constraint_engine(),
    )


@lru_cache()
def get_local_search_optimizer() -> LocalSearchOptimizer:
    return LocalSearchOptimizer(scoring=get_scoring_engine())


@lru_cache()
def get_llm_assistant() -> LLMArchitecturalAssistant:
    return LLMArchitecturalAssistant()

