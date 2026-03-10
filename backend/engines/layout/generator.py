from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Literal

import numpy as np
from shapely.geometry import LineString, Polygon

from backend.api.v1.schemas.room import RoomSpec
from backend.engines.layout.space_partitioner import Cell, SpacePartitioner

logger = logging.getLogger(__name__)


RoomKind = Literal["living", "kitchen", "bedroom", "other"]


@dataclass(frozen=True)
class GeneratedRoom:
    name: str
    category: str
    target_area: float
    polygon: Polygon


@dataclass(frozen=True)
class Layout:
    candidate_id: int
    rooms: list[GeneratedRoom]
    adjacency: list[tuple[str, str]]


class LayoutGenerator:
    def __init__(self) -> None:
        self.partitioner = SpacePartitioner()

    def generate_candidates(
        self,
        buildable: Polygon,
        room_specs: list[RoomSpec],
        num_candidates: int,
        seed: int,
    ) -> list[Layout]:
        if not room_specs:
            raise ValueError("rooms must be non-empty")

        total_attempts = int(num_candidates)
        layouts: list[Layout] = []

        # Run up to 3 retry batches with different seeds when 0 candidates generated
        max_retry_batches = 3
        for retry in range(max_retry_batches + 1):
            batch_seed = int(seed) + retry * 99991  # large prime offset per retry
            batch: list[Layout] = []
            for cid in range(total_attempts):
                candidate_seed = batch_seed + cid * 10007
                layout = self._generate_single_candidate(
                    candidate_id=len(layouts) + cid,
                    buildable=buildable,
                    room_specs=room_specs,
                    seed=candidate_seed,
                )
                if layout is not None:
                    batch.append(layout)

            layouts.extend(batch)
            # Stop retrying once we have at least 1 candidate
            if layouts:
                break
            logger.warning(f"layout_retry batch={retry} — no candidates, retrying with new seed")

        accepted = len(layouts)
        rejection_rate = 1.0 - (accepted / float(total_attempts * (retry + 1))) if total_attempts > 0 else 0.0

        logger.info(
            "layout_generation_attempts",
            extra={
                "total_attempts": total_attempts * (retry + 1),
                "valid_candidates": accepted,
                "rejection_rate": rejection_rate,
            },
        )
        return layouts

    def _generate_single_candidate(
        self,
        candidate_id: int,
        buildable: Polygon,
        room_specs: list[RoomSpec],
        seed: int,
    ) -> Layout | None:
        cells = self.partitioner.partition(buildable, n_cells=len(room_specs), seed=seed)
        if not self._partition_ok(cells, room_specs):
            return None

        rooms = self._assign_rooms(cells, room_specs, seed=seed, buildable=buildable)
        if len(rooms) != len(room_specs):
            return None

        if not self._semantic_ok(rooms, buildable):
            return None

        adjacency = self._compute_adjacency(rooms)
        return Layout(candidate_id=candidate_id, rooms=rooms, adjacency=adjacency)

    def _partition_ok(self, cells: list[Cell], specs: list[RoomSpec]) -> bool:
        # Early rejection based on area and thickness before hard constraints.
        total_area = sum(float(c.polygon.area) for c in cells)
        targets = [float(s.target_area) for s in specs]
        if not targets:
            return False
        target_total = sum(targets)

        # Require that partitioned area is at least 85% of requested target area.
        if total_area < 0.85 * target_total:
            return False

        min_target = min(targets)
        min_cell_area = 0.4 * min_target

        for cell in cells:
            area = float(cell.polygon.area)
            if area < min_cell_area:
                return False
            min_x, min_y, max_x, max_y = cell.polygon.bounds
            w = max_x - min_x
            h = max_y - min_y
            if min(w, h) < 1.0:
                # Too thin to host any reasonable room.
                return False

        return True

    def _classify_room(self, spec: RoomSpec) -> RoomKind:
        name = (spec.name or "").lower()
        if "kitchen" in name:
            return "kitchen"
        if name.startswith("living") or "living" in name:
            return "living"
        if name.startswith("bed") or "bedroom" in name:
            return "bedroom"
        return "other"

    def _assign_rooms(
        self,
        cells: list[Cell],
        specs: list[RoomSpec],
        seed: int,
        buildable: Polygon,
    ) -> list[GeneratedRoom]:
        rng = np.random.default_rng(int(seed))

        min_x, min_y, max_x, max_y = buildable.bounds
        depth = max(max_y - min_y, 1e-6)

        def zone_for_y(y: float) -> str:
            # Assume gate_direction="south": front near min_y.
            t = (y - min_y) / depth
            if t <= 0.25:
                return "front"
            if t <= 0.7:
                return "middle"
            return "rear"

        outer_boundary = buildable.boundary
        front_edge = LineString([(min_x, min_y), (max_x, min_y)])

        cell_infos: list[dict] = []
        for idx, cell in enumerate(cells):
            poly = cell.polygon
            cx, cy = float(poly.centroid.x), float(poly.centroid.y)
            zone = zone_for_y(cy)
            touch_outer = False
            touch_front = False

            try:
                inter_outer = poly.boundary.intersection(outer_boundary)
                touch_outer = float(getattr(inter_outer, "length", 0.0)) > 1e-6
            except Exception:
                touch_outer = False

            try:
                inter_front = poly.boundary.intersection(front_edge)
                touch_front = float(getattr(inter_front, "length", 0.0)) > 1e-6
            except Exception:
                touch_front = False

            min_bx, min_by, max_bx, max_by = poly.bounds
            bw = max_bx - min_bx
            bh = max_by - min_by
            bbox_ratio = bw / bh if bh > 1e-6 else float("inf")

            cell_infos.append(
                {
                    "index": idx,
                    "poly": poly,
                    "area": float(poly.area),
                    "centroid": (cx, cy),
                    "zone": zone,
                    "touch_outer": touch_outer,
                    "touch_front": touch_front,
                    "bbox_ratio": bbox_ratio,
                }
            )

        # Sort room specs by semantic priority, then by target area.
        spec_wrapped: list[tuple[RoomSpec, RoomKind, int, int]] = []
        for i, spec in enumerate(specs):
            kind = self._classify_room(spec)
            if kind == "living":
                priority = 0
            elif kind == "kitchen":
                priority = 1
            elif kind == "bedroom":
                priority = 2
            else:
                priority = 3
            spec_wrapped.append((spec, kind, priority, i))

        spec_wrapped.sort(
            key=lambda it: (
                it[2],
                -float(it[0].target_area),
                it[3],
            )
        )

        used_cells: set[int] = set()
        rooms: list[GeneratedRoom] = []

        for spec, kind, _priority, _idx in spec_wrapped:
            best_cell = None
            best_score = float("-inf")

            for info in cell_infos:
                if info["index"] in used_cells:
                    continue

                area = info["area"]
                target = float(spec.target_area)
                area_score = -abs(area - target) / max(target, 1e-6)

                zone = info["zone"]
                zone_score = 0.0
                if kind == "living":
                    if zone == "front":
                        zone_score = 1.0
                    elif zone == "middle":
                        zone_score = 0.4
                elif kind == "bedroom":
                    if zone == "rear":
                        zone_score = 1.0
                    elif zone == "middle":
                        zone_score = 0.6
                elif kind == "kitchen":
                    if zone == "rear":
                        zone_score = 0.7
                    elif zone == "middle":
                        zone_score = 0.4
                    else:
                        zone_score = 0.2

                boundary_score = 0.0
                if kind == "kitchen" and info["touch_outer"]:
                    boundary_score += 0.8

                front_score = 0.0
                if kind == "living" and info["touch_front"]:
                    front_score += 0.8
                if kind == "bedroom" and info["touch_front"]:
                    front_score -= 0.6

                # small jitter to break ties deterministically
                jitter = float(rng.uniform(-0.01, 0.01))

                score = (
                    0.6 * zone_score
                    + 0.3 * area_score
                    + 0.6 * boundary_score
                    + 0.6 * front_score
                    + jitter
                )

                if score > best_score:
                    best_score = score
                    best_cell = info

            if best_cell is None:
                continue

            used_cells.add(best_cell["index"])
            rooms.append(
                GeneratedRoom(
                    name=spec.name,
                    category=spec.category,
                    target_area=float(spec.target_area),
                    polygon=best_cell["poly"],
                )
            )

        return rooms

    def _semantic_ok(self, rooms: list[GeneratedRoom], buildable: Polygon) -> bool:
        if not rooms:
            return False

        min_x, min_y, max_x, max_y = buildable.bounds
        depth = max(max_y - min_y, 1e-6)
        buildable_area = float(buildable.area)

        front_edge = LineString([(min_x, min_y), (max_x, min_y)])
        outer_boundary = buildable.boundary

        def room_kind(room: GeneratedRoom) -> RoomKind:
            name = room.name.lower()
            if "kitchen" in name:
                return "kitchen"
            if name.startswith("living") or "living" in name:
                return "living"
            if name.startswith("bed") or "bedroom" in name:
                return "bedroom"
            return "other"

        has_kitchen_on_boundary = False
        has_bedroom_not_front = False
        has_living_front_zone = False

        for room in rooms:
            kind = room_kind(room)
            poly = room.polygon

            # Aspect ratio check — widened limits for small plots
            bx_min, by_min, bx_max, by_max = poly.bounds
            bw = bx_max - bx_min
            bh = by_max - by_min
            if bh <= 1e-6 or bw <= 1e-6:
                return False
            ratio = bw / bh

            # Looser limits: allow 0.4..2.5 for living/bed, 0.3..3.0 for kitchen
            if kind in ("bedroom", "living"):
                if ratio < 0.4 or ratio > 2.5:
                    return False
            elif kind == "kitchen":
                if ratio > 3.0:
                    return False

            # Boundary exposure logic.
            try:
                inter_outer = poly.boundary.intersection(outer_boundary)
                touches_outer = float(getattr(inter_outer, "length", 0.0)) > 1e-6
            except Exception:
                touches_outer = False

            try:
                inter_front = poly.boundary.intersection(front_edge)
                touches_front = float(getattr(inter_front, "length", 0.0)) > 1e-6
            except Exception:
                touches_front = False

            cy = float(poly.centroid.y)
            t = (cy - min_y) / depth
            in_front_zone = t <= 0.35  # slightly wider front zone

            if kind == "kitchen" and touches_outer:
                has_kitchen_on_boundary = True

            if kind == "bedroom" and not touches_front:
                has_bedroom_not_front = True

            if kind == "living" and (in_front_zone or touches_front):
                has_living_front_zone = True

        has_kitchen = any(room_kind(r) == "kitchen" for r in rooms)
        has_bedroom = any(room_kind(r) == "bedroom" for r in rooms)
        has_living = any(room_kind(r) == "living" for r in rooms)

        # Kitchen constraint: skip if plot is small (< 60 m2) or no kitchen
        if has_kitchen and buildable_area >= 60 and not has_kitchen_on_boundary:
            return False

        # Bedroom/living: advisory only on small plots, strict on large ones
        if buildable_area >= 80:
            if has_bedroom and not has_bedroom_not_front:
                return False
            if has_living and not has_living_front_zone:
                return False

        return True

    def _compute_adjacency(self, rooms: list[GeneratedRoom]) -> list[tuple[str, str]]:
        adj: set[tuple[str, str]] = set()
        eps = 1e-6
        for i in range(len(rooms)):
            for j in range(i + 1, len(rooms)):
                a = rooms[i].polygon
                b = rooms[j].polygon
                inter = a.boundary.intersection(b.boundary)
                if inter.is_empty:
                    continue
                shared = getattr(inter, "length", 0.0)
                if float(shared) > eps:
                    n1, n2 = rooms[i].name, rooms[j].name
                    if n1 <= n2:
                        adj.add((n1, n2))
                    else:
                        adj.add((n2, n1))
        return sorted(adj)

