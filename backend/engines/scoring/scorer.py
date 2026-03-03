from __future__ import annotations

from dataclasses import dataclass

from backend.api.v1.schemas.common import ScoreBreakdown
from backend.engines.layout.generator import Layout
from backend.engines.layout.models import Door
from backend.engines.scoring.metrics import (
    LayoutMetrics,
    vertical_circulation_efficiency,
    vertical_wet_alignment,
)


@dataclass(frozen=True)
class ScoredLayout:
    layout: Layout
    scores: ScoreBreakdown


class ScoringEngine:
    DEFAULT_WEIGHTS = {
        "space_utilization": 20,
        "adjacency_satisfaction": 18,
        "aspect_ratio_quality": 12,
        "natural_light_access": 12,
        "circulation_efficiency": 12,
        "privacy_score": 10,
        "orientation_match": 8,
        "structural_regularity": 4,
        "vertical_wet_alignment": 6,
        "vertical_circulation_efficiency": 6,
    }

    def score(
        self,
        layouts_with_doors: list[tuple[Layout, list[Door]]],
        buildable,
        gate_direction: str,
        weights: dict[str, float] | None = None,
        constraint_penalty: float = 0.0,
        num_floors: int = 1,
        buildings: list | None = None,
    ) -> list[ScoredLayout]:
        """Score each (layout, doors) with dimensions including vertical_wet_alignment when num_floors > 1."""
        w = weights or self.DEFAULT_WEIGHTS
        metrics = LayoutMetrics()
        scored: list[ScoredLayout] = []
        vertical_efficiency = 1.0 if num_floors == 1 else 0.85
        use_buildings = (
            num_floors > 1
            and buildings is not None
            and len(buildings) == len(layouts_with_doors)
        )

        for idx, (layout, doors) in enumerate(layouts_with_doors):
            if use_buildings and buildings[idx] is not None:
                wet_align = vertical_wet_alignment(buildings[idx])
                vert_circ = vertical_circulation_efficiency(buildings[idx])
            else:
                wet_align = 1.0
                vert_circ = 1.0
            dimension_scores = {
                "space_utilization": metrics.space_utilization(layout, buildable),
                "adjacency_satisfaction": metrics.adjacency_satisfaction(layout),
                "aspect_ratio_quality": metrics.aspect_ratio_quality(layout),
                "natural_light_access": metrics.natural_light_access(layout, buildable),
                "circulation_efficiency": metrics.circulation_efficiency(
                    layout, doors, buildable, gate_direction
                ),
                "privacy_score": metrics.privacy_score(layout, doors, gate_direction),
                "orientation_match": metrics.orientation_match(layout, buildable, gate_direction),
                "structural_regularity": metrics.structural_regularity(layout),
                "vertical_efficiency": vertical_efficiency,
                "vertical_wet_alignment": wet_align,
                "vertical_circulation_efficiency": vert_circ,
            }

            composite = sum(w.get(dim, 0) * score for dim, score in dimension_scores.items())
            composite -= constraint_penalty
            total = max(0.0, min(100.0, composite))

            breakdown = ScoreBreakdown(
                total=round(total, 2),
                dimension_scores=dimension_scores,
                pareto_rank=None,
                space_utilization=dimension_scores.get("space_utilization", 0.0),
                natural_light=dimension_scores.get("natural_light_access", 0.0),
                privacy=dimension_scores.get("privacy_score", 0.0),
            )
            scored.append(ScoredLayout(layout=layout, scores=breakdown))

        from backend.engines.scoring.pareto import pareto_rank
        scored = pareto_rank(scored)
        return scored
