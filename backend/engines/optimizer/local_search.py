from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union

from backend.api.v1.schemas.common import ScoreBreakdown
from backend.api.v1.schemas.layout import LayoutCandidate, RoomPlacement
from backend.engines.layout.generator import GeneratedRoom, Layout
from backend.engines.layout.hard_constraints import HardConstraintConfig, validate_layout_hard
from backend.engines.scoring.scorer import ScoringEngine, ScoredLayout
from backend.utils.geo_utils import safe_largest_polygon


@dataclass(frozen=True)
class LocalSearchResult:
    improved_layout: LayoutCandidate
    original_score: float
    improved_score: float


class LocalSearchOptimizer:
    def __init__(self, scoring: ScoringEngine) -> None:
        self._scoring = scoring

    def improve(
        self,
        layout: LayoutCandidate,
        gate_direction: str,
        iterations: int = 50,
        mutation_strength: float = 0.5,
        generation_seed: int = 42,
    ) -> LocalSearchResult:
        gen_seed = int(generation_seed) + 999
        rng = np.random.default_rng(gen_seed)

        rooms = [
            GeneratedRoom(
                name=r.name,
                category=r.category,
                target_area=float(r.target_area),
                polygon=Polygon(r.polygon),
            )
            for r in layout.rooms
        ]

        buildable = self._approx_buildable(rooms)
        base_layout = Layout(candidate_id=int(layout.candidate_id), rooms=rooms, adjacency=layout.adjacency)

        base_score = self._score_layout(base_layout, buildable, gate_direction)
        best_layout = base_layout
        best_score = base_score

        cfg = HardConstraintConfig()

        for _ in range(int(iterations)):
            mutated = self._mutate_one_room(best_layout, rng=rng, strength=mutation_strength)
            if mutated is None:
                continue

            ok, _ = validate_layout_hard(mutated, buildable=buildable, cfg=cfg)
            if not ok:
                continue

            score = self._score_layout(mutated, buildable, gate_direction)
            if score > best_score:
                best_layout = mutated
                best_score = score

        improved_candidate = self._to_candidate(best_layout, layout, best_score)
        return LocalSearchResult(
            improved_layout=improved_candidate,
            original_score=float(base_score),
            improved_score=float(best_score),
        )

    def _approx_buildable(self, rooms: list[GeneratedRoom]):
        polys = [r.polygon for r in rooms if not r.polygon.is_empty]
        if not polys:
            return Polygon()
        union = unary_union(polys)
        largest = safe_largest_polygon(union)
        return largest if largest is not None else Polygon()

    def _score_layout(self, layout: Layout, buildable, gate_direction: str) -> float:
        scored: list[ScoredLayout] = self._scoring.score(
            [(layout, [])],
            buildable=buildable,
            gate_direction=gate_direction,
        )
        if not scored:
            return 0.0
        return float(scored[0].scores.total)

    def _mutate_one_room(
        self,
        layout: Layout,
        rng: np.random.Generator,
        strength: float,
    ) -> Layout | None:
        if not layout.rooms:
            return None

        idx = int(rng.integers(0, len(layout.rooms)))
        room = layout.rooms[idx]
        poly = room.polygon

        mutated_poly = self._mutate_polygon(poly, rng=rng, strength=strength)
        if mutated_poly is None:
            return None

        new_rooms: list[GeneratedRoom] = []
        for i, r in enumerate(layout.rooms):
            if i == idx:
                new_rooms.append(
                    GeneratedRoom(
                        name=r.name,
                        category=r.category,
                        target_area=r.target_area,
                        polygon=mutated_poly,
                    )
                )
            else:
                new_rooms.append(r)

        return Layout(candidate_id=layout.candidate_id, rooms=new_rooms, adjacency=layout.adjacency)

    def _mutate_polygon(
        self,
        poly: Polygon,
        rng: np.random.Generator,
        strength: float,
    ) -> Polygon | None:
        if poly.is_empty or poly.area <= 0:
            return None

        coords = list(poly.exterior.coords)[:-1]
        if len(coords) < 3:
            return None

        # small translation
        dx = float(rng.uniform(-0.3, 0.3) * strength)
        dy = float(rng.uniform(-0.3, 0.3) * strength)
        moved = [(x + dx, y + dy) for (x, y) in coords]

        # small resize along one axis
        xs = [x for x, _ in moved]
        ys = [y for _, y in moved]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        w = max_x - min_x
        h = max_y - min_y

        cx = 0.5 * (min_x + max_x)
        cy = 0.5 * (min_y + max_y)

        axis = "x" if rng.random() < 0.5 else "y"

        if axis == "x" and w > 1e-6:
            delta = float(rng.uniform(-0.3, 0.3) * strength)
            factor = 1.0 + delta / max(w, 1e-6)
            resized = [(cx + (x - cx) * factor, y) for (x, y) in moved]
        elif axis == "y" and h > 1e-6:
            delta = float(rng.uniform(-0.3, 0.3) * strength)
            factor = 1.0 + delta / max(h, 1e-6)
            resized = [(x, cy + (y - cy) * factor) for (x, y) in moved]
        else:
            resized = moved

        candidate = Polygon(resized)
        if candidate.is_empty or not candidate.is_valid or candidate.area <= 0:
            return None
        return candidate

    def _to_candidate(
        self,
        layout: Layout,
        original: LayoutCandidate,
        improved_score: float,
    ) -> LayoutCandidate:
        rooms_out: list[RoomPlacement] = []
        xs: list[float] = []
        ys: list[float] = []

        for base in layout.rooms:
            poly = base.polygon
            coords = list(poly.exterior.coords)
            if len(coords) >= 2 and coords[0] == coords[-1]:
                coords = coords[:-1]
            pts = [(float(x), float(y)) for (x, y) in coords]
            xs.extend(x for x, _ in pts)
            ys.extend(y for _, y in pts)
            centroid = (float(poly.centroid.x), float(poly.centroid.y))
            rooms_out.append(
                RoomPlacement(
                    name=base.name,
                    category=base.category,
                    target_area=base.target_area,
                    area_m2=float(poly.area),
                    centroid=centroid,
                    polygon=pts,
                )
            )

        if xs and ys:
            from backend.api.v1.schemas.common import BBox

            bbox = BBox(min_x=min(xs), min_y=min(ys), max_x=max(xs), max_y=max(ys))
        else:
            bbox = original.bbox

        # Reuse adjacency and scores shape from original; total is the improved score
        orig_s = original.scores
        dim_scores = getattr(orig_s, "dimension_scores", None) or {}
        improved_breakdown = ScoreBreakdown(
            total=float(improved_score),
            dimension_scores=dim_scores,
            pareto_rank=getattr(orig_s, "pareto_rank", None),
            space_utilization=orig_s.space_utilization,
            natural_light=orig_s.natural_light,
            privacy=orig_s.privacy,
        )
        return LayoutCandidate(
            candidate_id=layout.candidate_id,
            rooms=rooms_out,
            adjacency=original.adjacency,
            adjacency_matrix=original.adjacency_matrix,
            circulation_paths=original.circulation_paths,
            doors=original.doors,
            bbox=bbox,
            scores=improved_breakdown,
        )

