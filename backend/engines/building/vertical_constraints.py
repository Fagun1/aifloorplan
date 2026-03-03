"""Vertical constraint skeleton: stair presence, alignment, and wet-stack hard constraint."""

from __future__ import annotations

from backend.engines.building.models import BuildingCandidate, Stair
from backend.engines.building.vertical_analysis import compute_wet_stack_alignment

MIN_ALIGNMENT_THRESHOLD = 0.4


class VerticalConstraintEngine:
    """Validate multi-floor building: stairs; stair alignment; wet-stack alignment threshold."""

    def validate(self, building: BuildingCandidate) -> tuple[bool, list[str]]:
        """
        If building has >1 floor:
        - Each floor except top must have at least one stair.
        - Stair positions must align across connected floors.
        - HC_WET_STACK_ALIGNMENT: alignment_score >= MIN_ALIGNMENT_THRESHOLD.
        Returns (True, []) when valid; (False, violations) otherwise.
        """
        violations: list[str] = []
        if not building.floors or len(building.floors) == 1:
            return (True, violations)

        num_floors = len(building.floors)
        for i in range(num_floors - 1):
            if not building.floors[i].stairs:
                violations.append(f"Floor {i} has no stair to floor {i + 1}.")
                continue
            # Stair position alignment: same (x,y) on both floors
            stair = building.floors[i].stairs[0]
            pos = stair.position
            next_stairs = building.floors[i + 1].stairs
            if next_stairs:
                other = next_stairs[0]
                if abs(other.position[0] - pos[0]) > 1e-9 or abs(other.position[1] - pos[1]) > 1e-9:
                    violations.append(f"Stair position mismatch between floor {i} and {i + 1}.")

        alignment_score = compute_wet_stack_alignment(building)
        if len(building.floors) > 1 and alignment_score < MIN_ALIGNMENT_THRESHOLD:
            violations.append(
                f"HC_WET_STACK_ALIGNMENT: alignment_score={alignment_score:.2f}"
            )

        return (len(violations) == 0, violations)
