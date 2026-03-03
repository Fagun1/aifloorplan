"""Vertical analysis: wet-stack alignment using polygon geometry only. Deterministic."""

from __future__ import annotations

from shapely.geometry import Polygon


WET_ROOM_KEYWORDS = ["bath", "toilet", "wash", "kitchen"]


def is_wet_room(room_name: str) -> bool:
    lower = room_name.lower()
    return any(k in lower for k in WET_ROOM_KEYWORDS)


def compute_wet_stack_alignment(building) -> float:
    """
    Returns normalized alignment score in [0, 1].
    Measures average vertical overlap ratio of wet rooms across consecutive floors.
    Deterministic; uses exact polygon intersection only.
    """
    floors = building.floors
    if len(floors) <= 1:
        return 1.0

    alignment_scores = []

    for i in range(len(floors) - 1):
        f0 = floors[i]
        f1 = floors[i + 1]

        wet0 = [r for r in f0.rooms if is_wet_room(r.name)]
        wet1 = [r for r in f1.rooms if is_wet_room(r.name)]

        if not wet0 or not wet1:
            continue

        pair_scores = []

        for r0 in wet0:
            poly0: Polygon = r0.polygon
            best_overlap = 0.0

            for r1 in wet1:
                poly1: Polygon = r1.polygon
                inter = poly0.intersection(poly1).area
                if poly0.area > 0:
                    overlap_ratio = inter / poly0.area
                    best_overlap = max(best_overlap, overlap_ratio)

            pair_scores.append(best_overlap)

        if pair_scores:
            alignment_scores.append(sum(pair_scores) / len(pair_scores))

    if not alignment_scores:
        return 1.0

    return max(0.0, min(1.0, sum(alignment_scores) / len(alignment_scores)))
