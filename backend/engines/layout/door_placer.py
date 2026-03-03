from __future__ import annotations

import math
from typing import Dict, List, Tuple

from shapely.geometry import LineString, Polygon

from backend.engines.layout.generator import GeneratedRoom, Layout
from backend.engines.layout.models import Door


class DoorPlacer:
    def place_doors(
        self,
        layout: Layout,
        buildable_polygon: Polygon,
        gate_direction: str,
        floor_number: int = 0,
    ) -> List[Door]:
        if not layout.rooms:
            return []

        rooms_by_name: Dict[str, GeneratedRoom] = {r.name: r for r in layout.rooms}

        # Build adjacency map with shared segments
        shared_segments: Dict[Tuple[str, str], Tuple[Tuple[float, float], Tuple[float, float]]] = {}
        room_names = sorted(rooms_by_name.keys())
        for i, a_name in enumerate(room_names):
            for b_name in room_names[i + 1 :]:
                a = rooms_by_name[a_name].polygon
                b = rooms_by_name[b_name].polygon
                inter = a.boundary.intersection(b.boundary)
                if inter.is_empty:
                    continue
                max_seg = _longest_segment(inter)
                if max_seg is None:
                    continue
                (x1, y1), (x2, y2) = max_seg
                seg_len = math.hypot(x2 - x1, y2 - y1)
                if seg_len < 0.9:
                    continue
                key = tuple(sorted((a_name, b_name)))
                # keep the longest segment per pair
                prev = shared_segments.get(key)
                if prev is not None:
                    px1, py1 = prev[0]
                    px2, py2 = prev[1]
                    prev_len = math.hypot(px2 - px1, py2 - py1)
                    if prev_len >= seg_len:
                        continue
                shared_segments[key] = ((x1, y1), (x2, y2))

        # Choose entrance room
        entrance_name = _select_entrance_room(layout.rooms, buildable_polygon, gate_direction)

        # Build adjacency graph (undirected)
        graph: Dict[str, List[str]] = {name: [] for name in room_names}
        for (a, b) in shared_segments.keys():
            graph[a].append(b)
            graph[b].append(a)

        # BFS from entrance to get minimal connectivity tree
        tree_edges: List[Tuple[str, str]] = []
        visited = set()
        queue: List[str] = []
        if entrance_name in graph:
            visited.add(entrance_name)
            queue.append(entrance_name)

        while queue:
            current = queue.pop(0)
            for nb in sorted(graph[current]):
                if nb in visited:
                    continue
                visited.add(nb)
                queue.append(nb)
                edge = tuple(sorted((current, nb)))
                if edge in shared_segments:
                    tree_edges.append(edge)

        doors: List[Door] = []
        door_idx = 0

        # Interior doors along BFS tree edges
        for a, b in tree_edges:
            seg = shared_segments.get(tuple(sorted((a, b))))
            if seg is None:
                continue
            p1, p2 = seg
            pos, angle = _door_from_segment(p1, p2, width=0.9)
            doors.append(
                Door(
                    id=f"d_{layout.candidate_id}_{door_idx}",
                    room_a=a,
                    room_b=b,
                    position=pos,
                    angle=angle,
                    width=0.9,
                    floor_number=floor_number,
                )
            )
            door_idx += 1

        # Exterior entry door on entrance room, if possible
        try:
            entry_door = _place_exterior_door(
                entrance=rooms_by_name[entrance_name],
                buildable=buildable_polygon,
                gate_direction=gate_direction,
                door_id=f"d_{layout.candidate_id}_{door_idx}",
                floor_number=floor_number,
            )
        except Exception:
            entry_door = None

        if entry_door is not None:
            doors.insert(0, entry_door)

        return doors


def _longest_segment(intersection) -> Tuple[Tuple[float, float], Tuple[float, float]] | None:
    if intersection.is_empty:
        return None
    geom_type = intersection.geom_type
    segments: List[Tuple[Tuple[float, float], Tuple[float, float]]] = []

    if geom_type == "LineString":
        coords = list(intersection.coords)
        for i in range(len(coords) - 1):
            segments.append((coords[i], coords[i + 1]))
    elif geom_type == "MultiLineString":
        for line in intersection.geoms:
            coords = list(line.coords)
            for i in range(len(coords) - 1):
                segments.append((coords[i], coords[i + 1]))
    else:
        return None

    if not segments:
        return None

    def seg_len(seg: Tuple[Tuple[float, float], Tuple[float, float]]) -> float:
        (x1, y1), (x2, y2) = seg
        return math.hypot(x2 - x1, y2 - y1)

    return max(segments, key=seg_len)


def _door_from_segment(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    width: float,
) -> Tuple[Tuple[float, float], float]:
    x1, y1 = p1
    x2, y2 = p2
    seg_len = math.hypot(x2 - x1, y2 - y1)
    if seg_len <= 1e-6:
        return ((x1, y1), 0.0)

    # avoid door very close to endpoints (0.3m margin each side)
    margin = min(0.3, max(0.0, (seg_len - width) * 0.25))
    t_margin = margin / seg_len if seg_len > 0 else 0.0
    t = 0.5
    if t_margin < 0.5:
        low = t_margin
        high = 1.0 - t_margin
        t = min(max(t, low), high)

    px = x1 + (x2 - x1) * t
    py = y1 + (y2 - y1) * t
    angle = math.atan2(y2 - y1, x2 - x1)
    return (float(px), float(py)), float(angle)


def _select_entrance_room(
    rooms: List[GeneratedRoom],
    buildable: Polygon,
    gate_direction: str,
) -> str:
    if not rooms:
        return ""
    # Prefer explicit "living" in name
    living_rooms = [r for r in rooms if "living" in r.name.lower()]
    if living_rooms:
        return living_rooms[0].name

    # Fallback: most front-zone public room
    min_x, min_y, max_x, max_y = buildable.bounds
    gd = gate_direction.lower()

    def front_score(room: GeneratedRoom) -> float:
        cx, cy = float(room.polygon.centroid.x), float(room.polygon.centroid.y)
        if gd == "south":
            return cy - min_y
        if gd == "north":
            return max_y - cy
        if gd == "west":
            return cx - min_x
        if gd == "east":
            return max_x - cx
        return cy - min_y

    candidates = sorted(rooms, key=lambda r: front_score(r))
    return candidates[0].name


def _place_exterior_door(
    entrance: GeneratedRoom,
    buildable: Polygon,
    gate_direction: str,
    door_id: str,
    floor_number: int,
) -> Door | None:
    min_x, min_y, max_x, max_y = buildable.bounds
    gd = gate_direction.lower()

    if gd == "south":
        front_line = LineString([(min_x, min_y), (max_x, min_y)])
        inward_angle = math.pi / 2  # facing +Y
    elif gd == "north":
        front_line = LineString([(min_x, max_y), (max_x, max_y)])
        inward_angle = -math.pi / 2
    elif gd == "west":
        front_line = LineString([(min_x, min_y), (min_x, max_y)])
        inward_angle = 0.0
    else:  # east
        front_line = LineString([(max_x, min_y), (max_x, max_y)])
        inward_angle = math.pi

    inter = entrance.polygon.boundary.intersection(front_line)
    if inter.is_empty:
        return None

    seg = _longest_segment(inter)
    if seg is None:
        return None

    pos, _ = _door_from_segment(seg[0], seg[1], width=1.0)
    return Door(
        id=door_id,
        room_a=entrance.name,
        room_b=None,
        position=pos,
        angle=float(inward_angle),
        width=1.0,
        floor_number=floor_number,
    )

