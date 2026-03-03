from __future__ import annotations

from dataclasses import dataclass

from shapely.geometry import Polygon

from backend.engines.layout.generator import Layout


@dataclass(frozen=True)
class HardConstraintConfig:
    min_room_dim_m: float = 2.0
    min_room_area_m2: float = 4.0
    overlap_area_eps: float = 1e-6


def _min_side_length_m(poly: Polygon) -> float:
    if poly.is_empty or poly.area <= 0:
        return 0.0
    mrr = poly.minimum_rotated_rectangle
    coords = list(mrr.exterior.coords)
    if len(coords) < 4:
        return 0.0
    # first 4 are corners; 5th repeats first
    corners = coords[:4]
    lens = []
    for i in range(4):
        x1, y1 = corners[i]
        x2, y2 = corners[(i + 1) % 4]
        dx = float(x2 - x1)
        dy = float(y2 - y1)
        lens.append((dx * dx + dy * dy) ** 0.5)
    if not lens:
        return 0.0
    return float(min(lens))


def validate_layout_hard(
    layout: Layout,
    buildable: Polygon,
    cfg: HardConstraintConfig | None = None,
) -> tuple[bool, list[str]]:
    cfg = cfg or HardConstraintConfig()
    reasons: list[str] = []

    polys = [r.polygon for r in layout.rooms]
    if not polys:
        return False, ["no_rooms"]

    # inside buildable + per-room minimums
    for r in layout.rooms:
        p = r.polygon
        if p.is_empty or p.area <= 0:
            reasons.append(f"{r.name}:empty_or_nonpositive_area")
            continue
        if not buildable.covers(p):
            reasons.append(f"{r.name}:outside_buildable")
        if float(p.area) < float(cfg.min_room_area_m2):
            reasons.append(f"{r.name}:area_below_min")
        if _min_side_length_m(p) < float(cfg.min_room_dim_m):
            reasons.append(f"{r.name}:min_dimension_below_min")

    # overlap check
    for i in range(len(layout.rooms)):
        for j in range(i + 1, len(layout.rooms)):
            a = layout.rooms[i].polygon
            b = layout.rooms[j].polygon
            inter = a.intersection(b)
            area = float(getattr(inter, "area", 0.0))
            if area > float(cfg.overlap_area_eps):
                reasons.append(f"overlap:{layout.rooms[i].name}|{layout.rooms[j].name}")

    return (len(reasons) == 0), reasons

