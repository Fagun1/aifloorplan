"""Maps user answers to constraint weights, soft constraints, and scoring adjustments."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ConstraintUpdate:
    """Result of processing answers: weights and soft constraints to apply."""

    scoring_weight_adjustments: dict[str, float]  # dimension -> weight delta or scale
    new_soft_constraint_ids: list[str]
    answered_categories: set[str]  # categories now considered answered


# Map: category -> option -> { dimension -> weight delta }. Additive; pipeline clamps.
ANSWER_WEIGHT_MAP: dict[str, dict[str, dict[str, float]]] = {
    "missing_adjacency_preferences": {
        "Living next to kitchen": {"adjacency_satisfaction": 2.0},
        "Bedrooms near bathroom": {"adjacency_satisfaction": 2.0},
        "Open plan living-dining": {"adjacency_satisfaction": 1.5, "circulation_efficiency": 0.5},
        "No preference": {},
    },
    "orientation_ambiguity": {
        "Toward street (gate side)": {"orientation_match": 2.0},
        "Toward back/garden": {"orientation_match": 1.5},
        "No strong preference": {},
    },
    "high_circulation_penalty": {
        "Prefer shorter paths from entrance": {"circulation_efficiency": 3.0},
        "Current layout is fine": {},
        "Minimize corridors": {"circulation_efficiency": 2.0},
    },
    "privacy_vs_light_tradeoff": {
        "Prioritize privacy": {"privacy_score": 3.0, "natural_light_access": -1.0},
        "Prioritize natural light": {"natural_light_access": 3.0, "privacy_score": -1.0},
        "Balance both": {},
    },
    "large_unused_area": {
        "Add more rooms later": {"space_utilization": 0.5},
        "Keep as open/flex space": {},
        "No change": {},
    },
    "overpacked_area": {
        "Prioritize key rooms only": {"space_utilization": 1.0},
        "Keep all rooms": {},
        "Reduce some room sizes": {"space_utilization": 1.0},
    },
}

# Categories that add a soft constraint when answered (e.g. for future penalty logic).
SOFT_CONSTRAINT_BY_CATEGORY: dict[str, str] = {
    "missing_adjacency_preferences": "soft_adjacency_preference",
    "orientation_ambiguity": "soft_orientation_preference",
    "high_circulation_penalty": "soft_circulation_preference",
    "privacy_vs_light_tradeoff": "soft_privacy_light_balance",
}


class AnswerProcessor:
    """Convert answers into updated constraint weights, soft constraints, scoring adjustments."""

    def process_answers(
        self,
        user_answers: dict[str, Any],
        question_categories: dict[str, str] | None = None,
    ) -> ConstraintUpdate:
        """
        user_answers: question_id -> answer (string or number).
        question_categories: optional question_id -> category (else derived from id).
        Returns ConstraintUpdate with weight deltas and soft constraint ids.
        """
        scoring_deltas: dict[str, float] = {}
        new_soft: list[str] = []
        answered_cats: set[str] = set()

        for qid, answer in user_answers.items():
            if answer is None or (isinstance(answer, str) and not answer.strip()):
                continue
            category = (question_categories or {}).get(qid) or self._category_from_id(qid)
            answered_cats.add(category)
            option = str(answer).strip()
            cat_map = ANSWER_WEIGHT_MAP.get(category, {})
            dim_deltas = cat_map.get(option) or cat_map.get("No preference") or cat_map.get("") or {}
            for dim, delta in dim_deltas.items():
                scoring_deltas[dim] = scoring_deltas.get(dim, 0.0) + delta
            soft_id = SOFT_CONSTRAINT_BY_CATEGORY.get(category)
            if soft_id and soft_id not in new_soft:
                new_soft.append(soft_id)

        return ConstraintUpdate(
            scoring_weight_adjustments=scoring_deltas,
            new_soft_constraint_ids=new_soft,
            answered_categories=answered_cats,
        )

    def _category_from_id(self, qid: str) -> str:
        """Derive category from question id: q_<category>_N -> category."""
        if not qid.startswith("q_"):
            return "unknown"
        parts = qid.split("_")
        if len(parts) >= 3:
            return "_".join(parts[1:-1])
        if len(parts) == 2:
            return parts[1]
        return "unknown"
