"""Deterministic gap detection for the Question Engine."""

from __future__ import annotations

from backend.engines.questions.models import Gap, UserInputState


class GapAnalyzer:
    """Detects missing info, ambiguities, and optimization opportunities. Fully deterministic."""

    # Room type keys that benefit from explicit adjacency preferences
    ADJACENCY_RELEVANT = frozenset({"living", "kitchen", "dining", "bedroom", "bathroom", "master"})

    def analyze(
        self,
        user_input: UserInputState,
        score_breakdown: dict[str, float] | None = None,
    ) -> list[Gap]:
        """
        Return structured gap objects. No randomness.
        score_breakdown: optional dimension_scores from a previous run (e.g. last layout).
        """
        gaps: list[Gap] = []

        # --- Missing adjacency preferences ---
        room_names = [self._norm(r.get("name", "")) for r in user_input.room_specs]
        ac = user_input.answered_categories or frozenset()
        if "missing_adjacency_preferences" not in ac and self._has_adjacency_relevant_rooms(room_names):
            gaps.append(
                Gap(
                    category="missing_adjacency_preferences",
                    severity="high",
                    detail="No adjacency preferences specified; layout quality can be improved by stating which rooms should be next to each other.",
                    question_hint="Which rooms should be next to each other? (e.g. living–kitchen, bedroom–bathroom)",
                    constraint_impact=["adjacency_satisfaction"],
                )
            )

        # --- Orientation ambiguities ---
        if "orientation_ambiguity" not in ac and user_input.room_specs:
            gaps.append(
                Gap(
                    category="orientation_ambiguity",
                    severity="medium",
                    detail="Orientation preferences not specified; we assume gate direction only.",
                    question_hint="Which way should main living areas face? (e.g. toward street, toward garden)",
                    constraint_impact=["orientation_match"],
                )
            )

        # --- High circulation penalty (requires prior scoring) ---
        if score_breakdown:
            circ = score_breakdown.get("circulation_efficiency", 1.0)
            if circ < 0.5:
                gaps.append(
                    Gap(
                        category="high_circulation_penalty",
                        severity="medium",
                        detail=f"Circulation efficiency is low ({circ:.2f}); consider simplifying room connections or entrance placement.",
                        question_hint="Would you prefer a more direct path from entrance to key rooms?",
                        constraint_impact=["circulation_efficiency"],
                    )
                )

            # --- Privacy vs light tradeoff ---
            priv = score_breakdown.get("privacy_score", 0.5)
            light = score_breakdown.get("natural_light_access", 0.5)
            if priv < 0.5 and light < 0.5:
                gaps.append(
                    Gap(
                        category="privacy_vs_light_tradeoff",
                        severity="medium",
                        detail="Both privacy and natural light scores are low; we can prioritize one.",
                        question_hint="Which matters more for you: privacy (bedrooms away from street) or natural light (rooms with exterior walls)?",
                        constraint_impact=["privacy_score", "natural_light_access"],
                    )
                )

        # --- Large unused area ---
        buildable = user_input.buildable_area_m2
        total_req = user_input.total_requested_area_m2
        if buildable is not None and total_req is not None and buildable > 1e-6:
            ratio = total_req / buildable
            if ratio < 0.5:
                gaps.append(
                    Gap(
                        category="large_unused_area",
                        severity="low",
                        detail=f"Requested area ({total_req:.0f} m²) is much less than buildable ({buildable:.0f} m²); consider adding rooms or uses.",
                        question_hint="Would you like to add more rooms or reserve space for future use?",
                        constraint_impact=["space_utilization"],
                    )
                )
            elif ratio > 0.95:
                gaps.append(
                    Gap(
                        category="overpacked_area",
                        severity="medium",
                        detail=f"Requested area ({total_req:.0f} m²) is close to buildable ({buildable:.0f} m²); layout may be tight.",
                        question_hint="Should we prioritize a subset of rooms if space is tight?",
                        constraint_impact=["space_utilization"],
                    )
                )

        return gaps

    def _norm(self, name: str) -> str:
        return (name or "").lower()

    def _has_adjacency_relevant_rooms(self, room_names: list[str]) -> bool:
        for r in room_names:
            for key in self.ADJACENCY_RELEVANT:
                if key in r:
                    return True
        return False
