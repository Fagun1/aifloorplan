"""Data models for the Dynamic Question Engine."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class UserInputState:
    """Current user specification for layout generation (no geometry mutation)."""

    gate_direction: str
    room_specs: list[dict[str, Any]]  # name, target_area, category
    setback_m: float
    buildable_area_m2: float | None = None  # set when geometry is available
    total_requested_area_m2: float | None = None  # sum of target_area
    answered_question_ids: frozenset[str] = frozenset()
    answered_categories: frozenset[str] = frozenset()  # skip gaps in these
    user_answers: dict[str, Any] | None = None  # question_id -> answer


@dataclass(frozen=True)
class Gap:
    """A detected information gap or optimization opportunity."""

    category: str  # e.g. missing_adjacency, orientation_ambiguity, circulation_penalty
    severity: str  # critical, high, medium, low
    detail: str
    question_hint: str | None = None  # optional hint for phrasing
    constraint_impact: list[str] = ()  # constraint ids this gap affects


@dataclass(frozen=True)
class StructuredQuestion:
    """A single question with type and options for answer mapping."""

    id: str
    text: str
    type: str  # single_choice, multi_choice, numeric, text, boolean
    options: list[str] = ()
    default: str | None = None
    category: str = ""
    why_it_matters: str = ""
    constraint_impact: list[str] = ()
    priority: int = 3  # 1-5
