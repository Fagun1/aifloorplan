from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from backend.api.v1.schemas.layout import LayoutCandidate
from backend.engines.llm.prompt_builder import (
    _aspect_ratio,
    _boundary_exposure_flags,
    _layout_bbox,
    _zone_for_point,
)


@dataclass(frozen=True)
class RoomChange:
    name: str
    category: str
    area_before: float
    area_after: float
    area_delta: float
    aspect_ratio_before: float
    aspect_ratio_after: float
    aspect_ratio_delta: float
    zone_before: str
    zone_after: str
    boundary_before: str
    boundary_after: str
    front_before: str
    front_after: str
    adjacency_added: List[str]
    adjacency_removed: List[str]


@dataclass(frozen=True)
class LayoutImprovementFeatures:
    gate_direction: str
    scores_before: Dict[str, float]
    scores_after: Dict[str, float]
    score_deltas: Dict[str, float]
    room_changes: List[RoomChange]


def _room_points(candidate: LayoutCandidate, name: str) -> List[Tuple[float, float]]:
    for r in candidate.rooms:
        if r.name == name:
            return [(float(x), float(y)) for (x, y) in r.polygon]
    return []


def extract_improvement_features(
    original: LayoutCandidate,
    improved: LayoutCandidate,
    gate_direction: str,
) -> LayoutImprovementFeatures:
    scores_before = {
        "space_utilization": float(original.scores.space_utilization),
        "natural_light": float(original.scores.natural_light),
        "privacy": float(original.scores.privacy),
        "total": float(original.scores.total),
    }
    scores_after = {
        "space_utilization": float(improved.scores.space_utilization),
        "natural_light": float(improved.scores.natural_light),
        "privacy": float(improved.scores.privacy),
        "total": float(improved.scores.total),
    }
    score_deltas = {
        k: float(scores_after[k] - scores_before[k]) for k in scores_before.keys()
    }

    bbox_before = _layout_bbox(original)
    bbox_after = _layout_bbox(improved)

    # Match rooms by name
    orig_by_name = {r.name: r for r in original.rooms}
    imp_by_name = {r.name: r for r in improved.rooms}

    room_changes: List[RoomChange] = []
    all_names = sorted(set(orig_by_name.keys()) | set(imp_by_name.keys()))

    for name in all_names:
        orig = orig_by_name.get(name)
        imp = imp_by_name.get(name)
        if not orig or not imp:
            # For now, skip rooms that were added/removed; prompt will still mention that
            # some rooms may have changed set membership implicitly.
            continue

        pts_before = _room_points(original, name)
        pts_after = _room_points(improved, name)

        area_before = float(orig.area_m2)
        area_after = float(imp.area_m2)

        ar_before = _aspect_ratio(pts_before) if pts_before else 1.0
        ar_after = _aspect_ratio(pts_after) if pts_after else 1.0

        zone_before = _zone_for_point(orig.centroid[0], orig.centroid[1], bbox_before, gate_direction)
        zone_after = _zone_for_point(imp.centroid[0], imp.centroid[1], bbox_after, gate_direction)

        boundary_before, front_before = _boundary_exposure_flags(
            pts_before,
            bbox_before,
            gate_direction,
        )
        boundary_after, front_after = _boundary_exposure_flags(
            pts_after,
            bbox_after,
            gate_direction,
        )

        adj_before = set(original.adjacency_matrix.get(name, []))
        adj_after = set(improved.adjacency_matrix.get(name, []))
        added = sorted(adj_after - adj_before)
        removed = sorted(adj_before - adj_after)

        room_changes.append(
            RoomChange(
                name=name,
                category=str(orig.category),
                area_before=area_before,
                area_after=area_after,
                area_delta=area_after - area_before,
                aspect_ratio_before=ar_before,
                aspect_ratio_after=ar_after,
                aspect_ratio_delta=ar_after - ar_before,
                zone_before=zone_before,
                zone_after=zone_after,
                boundary_before=boundary_before,
                boundary_after=boundary_after,
                front_before=front_before,
                front_after=front_after,
                adjacency_added=added,
                adjacency_removed=removed,
            )
        )

    return LayoutImprovementFeatures(
        gate_direction=gate_direction,
        scores_before=scores_before,
        scores_after=scores_after,
        score_deltas=score_deltas,
        room_changes=room_changes,
    )


def build_improvement_prompt(features: LayoutImprovementFeatures) -> Tuple[str, str]:
    system = (
        "You are an experienced residential architect.\n"
        "You are given a BEFORE and AFTER version of the same layout, with scores and per-room differences.\n"
        "You must explain why the score improved (or changed), using only the provided structured differences.\n"
        "Do not invent new rooms, dimensions, windows, doors, or any geometry that is not present in the input.\n"
        "Do not fabricate polygon coordinates or exact sizes beyond the given areas and aspect ratios.\n"
        "Respond in JSON with keys: summary, key_changes, why_score_improved, tradeoffs, rooms_most_affected.\n"
        "Each of key_changes, why_score_improved, tradeoffs, rooms_most_affected should be an array of short bullet strings."
    )

    lines: List[str] = []
    lines.append("Layout improvement summary:")
    lines.append(
        f"- Gate direction: {features.gate_direction}"
    )
    lines.append(
        "Scores before: "
        f"total={features.scores_before['total']:.3f}, "
        f"space_utilization={features.scores_before['space_utilization']:.3f}, "
        f"natural_light={features.scores_before['natural_light']:.3f}, "
        f"privacy={features.scores_before['privacy']:.3f}"
    )
    lines.append(
        "Scores after:  "
        f"total={features.scores_after['total']:.3f}, "
        f"space_utilization={features.scores_after['space_utilization']:.3f}, "
        f"natural_light={features.scores_after['natural_light']:.3f}, "
        f"privacy={features.scores_after['privacy']:.3f}"
    )
    lines.append(
        "Score deltas: "
        f"total={features.score_deltas['total']:+.3f}, "
        f"space_utilization={features.score_deltas['space_utilization']:+.3f}, "
        f"natural_light={features.score_deltas['natural_light']:+.3f}, "
        f"privacy={features.score_deltas['privacy']:+.3f}"
    )
    lines.append("")
    lines.append("Per-room differences:")
    for r in features.room_changes:
        lines.append(
            f"- {r.name} (category={r.category}): "
            f"area {r.area_before:.1f}→{r.area_after:.1f} (Δ={r.area_delta:+.1f}), "
            f"aspect_ratio {r.aspect_ratio_before:.2f}→{r.aspect_ratio_after:.2f} (Δ={r.aspect_ratio_delta:+.2f}), "
            f"zone {r.zone_before}→{r.zone_after}, "
            f"boundary {r.boundary_before}→{r.boundary_after}, "
            f"front_exposure {r.front_before}→{r.front_after}"
        )
        if r.adjacency_added:
            lines.append(f"  - New adjacencies: {', '.join(r.adjacency_added)}")
        if r.adjacency_removed:
            lines.append(f"  - Lost adjacencies: {', '.join(r.adjacency_removed)}")

    lines.append("")
    lines.append(
        "Using only the structured differences above, explain in architectural terms "
        "why the AFTER layout's score changed relative to BEFORE."
    )
    lines.append(
        "Focus on zoning shifts (front/middle/rear), privacy, natural light exposure, and adjacency changes."
    )
    lines.append(
        "Do not suggest exact new coordinates or shapes; keep recommendations qualitative and high level."
    )

    user = "\n".join(lines)
    return system, user

