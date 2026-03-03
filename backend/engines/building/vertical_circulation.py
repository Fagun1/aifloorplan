"""Vertical circulation: building graph (doors + stairs) and path efficiency. Deterministic."""

from __future__ import annotations

from collections import deque, defaultdict


def _nearest_room(floor, position):
    """Room on floor whose centroid is nearest to position. Deterministic."""
    min_dist = float("inf")
    nearest = None
    x, y = position

    for room in floor.rooms:
        cx = float(room.polygon.centroid.x)
        cy = float(room.polygon.centroid.y)
        dist = (cx - x) ** 2 + (cy - y) ** 2
        if dist < min_dist:
            min_dist = dist
            nearest = room

    return nearest


def build_building_graph(building):
    """
    Builds adjacency graph:
    Nodes: (floor_number, room_name)
    Edges:
      - Door edges (same floor)
      - Stair edges (across floors)
    Returns adjacency dict. Deterministic.
    """
    graph = defaultdict(set)

    for floor in building.floors:
        f = floor.floor_number

        # Door edges
        for door in floor.doors:
            if door.room_b is not None:
                a = (f, door.room_a)
                b = (f, door.room_b)
                graph[a].add(b)
                graph[b].add(a)

        # Stair edges
        for stair in floor.stairs:
            f0, f1 = stair.connects_floors
            room_lower = _nearest_room(building.floors[f0], stair.position)
            room_upper = _nearest_room(building.floors[f1], stair.position)

            if room_lower and room_upper:
                a = (f0, room_lower.name)
                b = (f1, room_upper.name)
                graph[a].add(b)
                graph[b].add(a)

    return graph


def compute_vertical_circulation_efficiency(building):
    """
    Returns score in [0, 1].
    Measures shortest-path efficiency from entrance to all habitable rooms.
    BFS only; deterministic.
    """
    if len(building.floors) <= 1:
        return 1.0

    graph = build_building_graph(building)

    entrance_room = None
    for door in building.floors[0].doors:
        if door.room_b is None:
            entrance_room = door.room_a
            break

    if entrance_room is None and building.floors[0].rooms:
        entrance_room = building.floors[0].rooms[0].name
    if entrance_room is None:
        return 0.0

    start = (0, entrance_room)

    dist = {}
    queue = deque([start])
    dist[start] = 0

    while queue:
        node = queue.popleft()
        for nb in sorted(graph[node]):
            if nb not in dist:
                dist[nb] = dist[node] + 1
                queue.append(nb)

    path_lengths = []
    for floor in building.floors:
        for room in floor.rooms:
            node = (floor.floor_number, room.name)
            if node in dist:
                path_lengths.append(dist[node])

    if not path_lengths:
        return 0.0

    avg_len = sum(path_lengths) / len(path_lengths)
    max_len = max(path_lengths)

    score = 1.0 - min(1.0, (avg_len / 6.0))
    score *= 1.0 - min(1.0, (max_len / 10.0))

    return max(0.0, min(1.0, score))
