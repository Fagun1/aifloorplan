from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from backend.api.v1.schemas.layout import LayoutCandidate


@dataclass(frozen=True)
class RoomFeatures:
    name: str
    category: str
    area_m2: float
    aspect_ratio: float
    zone: str
    boundary_exposure: str
    front_exposure: str
    violations: List[str]
    adjacent_to: List[str]


@dataclass(frozen=True)
class LayoutFeatures:
    gate_direction: str
    scores: Dict[str, float]
    rooms: List[RoomFeatures]


def _layout_bbox(candidate: LayoutCandidate) -> Tuple[float, float, float, float]:
    return (
        candidate.bbox.min_x,
        candidate.bbox.min_y,
        candidate.bbox.max_x,
        candidate.bbox.max_y,
    )


def _zone_for_point(
    x: float,
    y: float,
    bbox: Tuple[float, float, float, float],
    gate_direction: str,
) -> str:
    min_x, min_y, max_x, max_y = bbox
    gx = gate_direction.lower()

    if gx in {"south", "north"}:
        depth = max(max_y - min_y, 1e-6)
        t = (y - min_y) / depth
        if gx == "south":
            # front at min_y
            if t <= 0.25:
                return "front"
            if t <= 0.7:
                return "middle"
            return "rear"
        # north: front at max_y
        t = (max_y - y) / depth
        if t <= 0.25:
            return "front"
        if t <= 0.7:
            return "middle"
        return "rear"

    # east / west: use x axis
    width = max(max_x - min_x, 1e-6)
    t = (x - min_x) / width
    if gx == "west":
        if t <= 0.25:
            return "front"
        if t <= 0.7:
            return "middle"
        return "rear"
    # east: front at max_x
    t = (max_x - x) / width
    if t <= 0.25:
        return "front"
    if t <= 0.7:
        return "middle"
    return "rear"


def _boundary_exposure_flags(
    room_pts: List[Tuple[float, float]],
    bbox: Tuple[float, float, float, float],
    gate_direction: str,
) -> Tuple[str, str]:
    min_x, min_y, max_x, max_y = bbox
    eps = 1e-6
    touches_any = False
    touches_front = False
    gd = gate_direction.lower()

    for x, y in room_pts:
        if abs(x - min_x) <= eps or abs(x - max_x) <= eps or abs(y - min_y) <= eps or abs(
            y - max_y
        ) <= eps:
            touches_any = True
        if gd == "south" and abs(y - min_y) <= eps:
            touches_front = True
        elif gd == "north" and abs(y - max_y) <= eps:
            touches_front = True
        elif gd == "west" and abs(x - min_x) <= eps:
            touches_front = True
        elif gd == "east" and abs(x - max_x) <= eps:
            touches_front = True

    bex = "touches_boundary" if touches_any else "interior"
    fex = "touches_front_edge" if touches_front else "away_from_front_edge"
    return bex, fex


def _aspect_ratio(room_pts: List[Tuple[float, float]]) -> float:
    xs = [x for x, _ in room_pts]
    ys = [y for _, y in room_pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    w = max_x - min_x
    h = max_y - min_y
    if h <= 1e-6 or w <= 1e-6:
        return 1.0
    r = w / h
    return float(r)


def _basic_room_violations(
    name: str,
    category: str,
    area_m2: float,
    aspect_ratio: float,
    zone: str,
    boundary_exposure: str,
    front_exposure: str,
) -> List[str]:
    cat = (category or "").lower()
    violations: List[str] = []

    if area_m2 < 4.0:
        violations.append("area_below_4m2")

    if cat in {"private"} and zone == "front":
        violations.append("bedroom_in_front_zone")

    if "living" in name.lower() and zone != "front":
        violations.append("living_not_in_front_zone")

    if "kitchen" in name.lower() and boundary_exposure != "touches_boundary":
        violations.append("kitchen_not_on_boundary")

    if cat in {"public", "private"} and (aspect_ratio < 0.6 or aspect_ratio > 2.2):
        violations.append("aspect_ratio_outside_comfort_range")

    if cat == "private" and front_exposure == "touches_front_edge":
        violations.append("bedroom_on_front_edge")

    return violations


def extract_layout_features(
    candidate: LayoutCandidate,
    gate_direction: str,
) -> LayoutFeatures:
    bbox = _layout_bbox(candidate)

    rooms: List[RoomFeatures] = []
    adjacency = candidate.adjacency_matrix

    for room in candidate.rooms:
        pts = [(float(x), float(y)) for (x, y) in room.polygon]
        area = float(room.area_m2)
        ar = _aspect_ratio(pts)
        zone = _zone_for_point(room.centroid[0], room.centroid[1], bbox, gate_direction)
        bex, fex = _boundary_exposure_flags(pts, bbox, gate_direction)
        violations = _basic_room_violations(
            name=room.name,
            category=room.category,
            area_m2=area,
            aspect_ratio=ar,
            zone=zone,
            boundary_exposure=bex,
            front_exposure=fex,
        )
        adj = adjacency.get(room.name, [])
        rooms.append(
            RoomFeatures(
                name=room.name,
                category=str(room.category),
                area_m2=area,
                aspect_ratio=ar,
                zone=zone,
                boundary_exposure=bex,
                front_exposure=fex,
                violations=violations,
                adjacent_to=list(adj),
            )
        )

    scores = {
        "space_utilization": float(candidate.scores.space_utilization),
        "natural_light": float(candidate.scores.natural_light),
        "privacy": float(candidate.scores.privacy),
        "total": float(candidate.scores.total),
    }

    return LayoutFeatures(gate_direction=gate_direction, scores=scores, rooms=rooms)


def build_analysis_prompt(features: LayoutFeatures) -> Tuple[str, str]:
    system = (
        "You are an experienced residential architect.\n"
        "You analyze proposed apartment layouts and provide concise, structured feedback.\n"
        "You must only reason about the rooms, metrics, and relationships explicitly provided.\n"
        "Do not invent dimensions, additional rooms, windows, doors, or any geometry that is not present in the input.\n"
        "Do not fabricate polygon coordinates or exact measurements beyond what is given.\n"
        "Focus on qualitative architectural reasoning: circulation, zoning, privacy, light, and adjacency.\n"
        "Respond in JSON with keys: summary, strengths, weaknesses, suggestions, architectural_notes.\n"
        "Each of strengths, weaknesses, suggestions, architectural_notes should be an array of short bullet strings."
    )

    lines: List[str] = []
    lines.append("Layout summary features:")
    lines.append(f"- Gate direction: {features.gate_direction}")
    lines.append(
        f"- Scores: total={features.scores['total']:.3f}, "
        f"space_utilization={features.scores['space_utilization']:.3f}, "
        f"natural_light={features.scores['natural_light']:.3f}, "
        f"privacy={features.scores['privacy']:.3f}"
    )
    lines.append("")
    lines.append("Rooms:")
    for r in features.rooms:
        lines.append(
            f"- {r.name} (category={r.category}, area_m2={r.area_m2:.1f}, "
            f"aspect_ratio={r.aspect_ratio:.2f}, zone={r.zone}, "
            f"boundary_exposure={r.boundary_exposure}, front_exposure={r.front_exposure})"
        )
        if r.adjacent_to:
            lines.append(f"  - Adjacent to: {', '.join(r.adjacent_to)}")
        if r.violations:
            lines.append(f"  - Violations: {', '.join(r.violations)}")

    lines.append("")
    lines.append(
        "Using only the structured information above, analyze the layout from an architectural point of view."
    )
    lines.append(
        "Comment on zoning (front/middle/rear), natural light access, privacy, and adjacency patterns."
    )
    lines.append(
        "Do not propose new room shapes or coordinates; only suggest qualitative adjustments (e.g., "
        "'move bedroom further from front zone', 'consider grouping wet areas together')."
    )

    user = "\n".join(lines)
    return system, user

