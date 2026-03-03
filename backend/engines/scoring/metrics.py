from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass
from typing import List

from shapely.geometry import LineString, Polygon

from backend.engines.layout.generator import Layout
from backend.engines.layout.models import Door

# Default adjacency preferences: (room_a_key, room_b_key) -> preferred (1.0 = should be adjacent)
# Keys are normalized room name substrings / categories.
_ADJ_PREFERENCE_PAIRS = [
    ("living", "kitchen"),
    ("living", "dining"),
    ("kitchen", "dining"),
    ("bedroom", "bathroom"),
    ("master", "bathroom"),
    ("bedroom", "master"),
]

# Habitable room types for natural light (must have exterior exposure).
_HABITABLE_NAMES = frozenset(
    {"living", "kitchen", "bedroom", "master", "dining", "study", "guest"}
)

# Public = near entrance preferred; private = far preferred.
_PUBLIC_CATEGORIES = frozenset({"public"})
_PRIVATE_CATEGORIES = frozenset({"private"})

# Ideal aspect ratio (min, max) by room name substring.
_IDEAL_ASPECT: dict[str, tuple[float, float]] = {
    "bedroom": (1.0, 1.8),
    "master": (1.0, 1.6),
    "living": (1.2, 1.9),
    "kitchen": (1.0, 2.2),
    "bathroom": (1.0, 2.2),
    "dining": (1.0, 1.6),
    "study": (1.0, 1.5),
}


def _front_line(buildable: Polygon, gate_direction: str) -> LineString:
    min_x, min_y, max_x, max_y = buildable.bounds
    d = (gate_direction or "south").lower()
    if d == "north":
        return LineString([(min_x, max_y), (max_x, max_y)])
    if d == "south":
        return LineString([(min_x, min_y), (max_x, min_y)])
    if d == "east":
        return LineString([(max_x, min_y), (max_x, max_y)])
    if d == "west":
        return LineString([(min_x, min_y), (min_x, max_y)])
    return LineString([(min_x, min_y), (max_x, min_y)])


def _build_door_graph(doors: List[Door]) -> tuple[dict[str, List[str]], str | None]:
    """Build room -> list of neighbors from interior doors; return (graph, entrance_room)."""
    graph: dict[str, list[str]] = {}
    entrance: str | None = None
    for d in doors:
        a, b = d.room_a, d.room_b
        if a not in graph:
            graph[a] = []
        if b is None:
            entrance = a
            continue
        graph[a].append(b)
        if b not in graph:
            graph[b] = []
        graph[b].append(a)
    return graph, entrance


def _bfs_path_lengths(graph: dict[str, list[str]], start: str) -> dict[str, int]:
    """Return shortest path length in number of steps (door transitions) from start."""
    dist: dict[str, int] = {start: 0}
    q: deque[str] = deque([start])
    while q:
        u = q.popleft()
        for v in graph.get(u, []):
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist


def _room_key(name: str) -> str:
    return name.lower()


def _matches_key(name: str, key: str) -> bool:
    return key in _room_key(name)


@dataclass(frozen=True)
class MetricInputs:
    buildable: Polygon
    gate_direction: str


class LayoutMetrics:
    """Eight normalized [0,1] scoring dimensions per PROJECT_ARCHITECTURE §9."""

    def space_utilization(self, layout: Layout, buildable: Polygon) -> float:
        """S_util: Usable room area / buildable area; sweet spot 0.60–0.90."""
        total_room = sum(float(r.polygon.area) for r in layout.rooms)
        total = float(buildable.area)
        if total <= 0:
            return 0.0
        ratio = total_room / total
        if ratio < 0.60:
            return float(max(0.0, min(1.0, ratio / 0.60)))
        if ratio <= 0.90:
            return 1.0
        return float(max(0.0, 1.0 - (ratio - 0.90) * 5.0))

    def adjacency_satisfaction(self, layout: Layout) -> float:
        """S_adj: Fraction of preferred adjacency pairs that are adjacent."""
        adj_set = set()
        for a, b in layout.adjacency:
            adj_set.add((min(a, b), max(a, b)))
        satisfied = 0
        total = 0
        for key_a, key_b in _ADJ_PREFERENCE_PAIRS:
            found_a = [r.name for r in layout.rooms if _matches_key(r.name, key_a)]
            found_b = [r.name for r in layout.rooms if _matches_key(r.name, key_b)]
            if not found_a or not found_b:
                continue
            total += 1
            for na in found_a:
                for nb in found_b:
                    if (min(na, nb), max(na, nb)) in adj_set:
                        satisfied += 1
                        break
                else:
                    continue
                break
        if total == 0:
            return 1.0
        return float(max(0.0, min(1.0, satisfied / total)))

    def _aspect_ratio(self, poly: Polygon) -> float:
        min_x, min_y, max_x, max_y = poly.bounds
        w = max_x - min_x
        h = max_y - min_y
        if h <= 1e-9:
            return 2.5
        return max(w / h, h / w)

    def aspect_ratio_quality(self, layout: Layout) -> float:
        """S_aspect: Rooms closer to ideal aspect ratio score higher."""
        if not layout.rooms:
            return 0.5
        scores = []
        for r in layout.rooms:
            ar = self._aspect_ratio(r.polygon)
            ideal = (1.0, 2.0)
            for key, (lo, hi) in _IDEAL_ASPECT.items():
                if _matches_key(r.name, key):
                    ideal = (lo, hi)
                    break
            if ideal[0] <= ar <= ideal[1]:
                scores.append(1.0)
            else:
                dist = min(abs(ar - ideal[0]), abs(ar - ideal[1]))
                scores.append(max(0.0, 1.0 - dist * 0.3))
        return float(max(0.0, min(1.0, sum(scores) / len(scores))))

    def natural_light_access(self, layout: Layout, buildable: Polygon) -> float:
        """S_light: Fraction of habitable rooms with exterior wall >= 1.5 m."""
        exterior = buildable.boundary
        habitable = [r for r in layout.rooms if any(_matches_key(r.name, h) for h in _HABITABLE_NAMES)]
        if not habitable:
            return 1.0
        lit = 0
        for r in habitable:
            shared = r.polygon.boundary.intersection(exterior)
            length = float(getattr(shared, "length", 0.0))
            if length >= 1.5:
                lit += 1
        return float(max(0.0, min(1.0, lit / len(habitable))))

    def circulation_efficiency(
        self,
        layout: Layout,
        doors: List[Door] | None,
        buildable: Polygon,
        gate_direction: str,
    ) -> float:
        """S_circ: Door-aware. BFS from entrance; penalize >2 transitions for bed/kitchen, long paths."""
        if not doors or not layout.rooms:
            return 0.7  # neutral when no door data
        graph, entrance = _build_door_graph(doors)
        if not graph or entrance is None:
            return 0.7
        dists = _bfs_path_lengths(graph, entrance)
        room_names = {r.name for r in layout.rooms}
        path_lengths = [dists[r] for r in room_names if r in dists]
        if not path_lengths:
            return 0.5
        avg_path = sum(path_lengths) / len(path_lengths)
        max_path = max(path_lengths) if path_lengths else 0
        penalty = 0.0
        for r in layout.rooms:
            name = r.name.lower()
            d = dists.get(r.name, 999)
            if ("bed" in name or "master" in name or "kitchen" in name) and d > 2:
                penalty += 0.15
        if max_path > 4:
            penalty += 0.1 * (max_path - 4)
        if avg_path > 2.5:
            penalty += 0.1 * min(avg_path - 2.5, 2.0)
        return float(max(0.0, min(1.0, 1.0 - penalty)))

    def privacy_score(
        self,
        layout: Layout,
        doors: List[Door] | None,
        gate_direction: str,
    ) -> float:
        """S_priv: Door-graph based. Public rooms shorter path from entrance, private longer."""
        if not doors or not layout.rooms:
            return 0.5
        graph, entrance = _build_door_graph(doors)
        if not graph or entrance is None:
            return 0.5
        dists = _bfs_path_lengths(graph, entrance)
        public_d = []
        private_d = []
        for r in layout.rooms:
            d = dists.get(r.name, 999)
            cat = (r.category or "public").lower()
            if cat == "public":
                public_d.append(d)
            elif cat == "private":
                private_d.append(d)
        if not public_d and not private_d:
            return 0.5
        if not public_d or not private_d:
            return 0.5
        avg_public = sum(public_d) / len(public_d)
        avg_private = sum(private_d) / len(private_d)
        if avg_private > avg_public:
            gap = avg_private - avg_public
            scale = max(avg_public, 0.5)
            return float(max(0.0, min(1.0, 0.5 + gap / (scale * 2))))
        gap = avg_public - avg_private
        scale = max(avg_private, 0.5)
        return float(max(0.0, min(1.0, 0.5 - gap / (scale * 2))))

    def orientation_match(
        self,
        layout: Layout,
        buildable: Polygon,
        gate_direction: str,
    ) -> float:
        """S_orient: Prefer living near front (gate), bedrooms away from front."""
        if not layout.rooms:
            return 0.5
        front = _front_line(buildable, gate_direction)
        min_x, min_y, max_x, max_y = buildable.bounds
        diag = math.hypot(max_x - min_x, max_y - min_y) or 1e-6
        gd = (gate_direction or "south").lower()
        scores = []
        for r in layout.rooms:
            cx = float(r.polygon.centroid.x)
            cy = float(r.polygon.centroid.y)
            dist_to_front = float(front.distance(LineString([(cx, cy), (cx, cy)])))
            norm = max(0.0, min(1.0, dist_to_front / diag))
            name = r.name.lower()
            if "living" in name or "kitchen" in name:
                scores.append(1.0 - norm)
            elif "bed" in name or "master" in name:
                scores.append(norm)
            else:
                scores.append(0.5)
        return float(max(0.0, min(1.0, sum(scores) / len(scores))))

    def structural_regularity(self, layout: Layout) -> float:
        """S_struct: Wall alignment to axes (0°, 90°)."""
        if not layout.rooms:
            return 0.5
        aligned = 0
        total = 0
        for r in layout.rooms:
            try:
                coords = list(r.polygon.exterior.coords)
            except Exception:
                continue
            for i in range(len(coords) - 1):
                x1, y1 = coords[i][0], coords[i][1]
                x2, y2 = coords[i + 1][0], coords[i + 1][1]
                dx, dy = x2 - x1, y2 - y1
                length = math.hypot(dx, dy)
                if length < 0.1:
                    continue
                total += 1
                angle = math.degrees(math.atan2(dy, dx)) % 180
                if angle <= 15 or angle >= 165 or (75 <= angle <= 105):
                    aligned += 1
        if total == 0:
            return 0.5
        return float(max(0.0, min(1.0, aligned / total)))


def vertical_wet_alignment(building) -> float:
    """Wet-stack vertical alignment score [0, 1]. Only meaningful when num_floors > 1."""
    from backend.engines.building.vertical_analysis import compute_wet_stack_alignment
    return compute_wet_stack_alignment(building)


def vertical_circulation_efficiency(building) -> float:
    """Vertical circulation efficiency [0, 1] from door+stair graph BFS. Only when num_floors > 1."""
    from backend.engines.building.vertical_circulation import (
        compute_vertical_circulation_efficiency,
    )
    return compute_vertical_circulation_efficiency(building)


# Legacy standalone functions for backward compatibility
def space_utilization_from_area_fit(room_areas: list[float], target_areas: list[float]) -> float:
    if not room_areas or not target_areas or len(room_areas) != len(target_areas):
        return 0.0
    errs = []
    for a, t in zip(room_areas, target_areas, strict=False):
        t = max(float(t), 1e-6)
        errs.append(abs(float(a) - float(t)) / t)
    mean_err = sum(errs) / max(1, len(errs))
    return float(max(0.0, min(1.0, 1.0 - mean_err)))


def natural_light_score(buildable: Polygon, room_polys: list[Polygon]) -> float:
    outer = buildable.boundary
    vals = []
    for p in room_polys:
        shared = p.boundary.intersection(outer)
        shared_len = float(getattr(shared, "length", 0.0))
        perim = float(p.length) if p.length > 1e-9 else 1.0
        vals.append(shared_len / perim)
    if not vals:
        return 0.0
    return float(max(0.0, min(1.0, sum(vals) / len(vals))))


def privacy_score(
    buildable: Polygon,
    gate_direction: str,
    room_centroids: list[tuple[float, float]],
    categories: list[str],
) -> float:
    front = _front_line(buildable, gate_direction)
    min_x, min_y, max_x, max_y = buildable.bounds
    diag = math.hypot(max_x - min_x, max_y - min_y) or 1e-6
    scores = []
    for (x, y), cat in zip(room_centroids, categories, strict=False):
        dist = float(front.distance(LineString([(x, y), (x, y)])))
        norm = max(0.0, min(1.0, dist / diag))
        c = (cat or "public").lower()
        if c == "private":
            scores.append(norm)
        elif c == "public":
            scores.append(1.0 - norm)
        else:
            scores.append(0.5)
    if not scores:
        return 0.0
    return float(max(0.0, min(1.0, sum(scores) / len(scores))))
