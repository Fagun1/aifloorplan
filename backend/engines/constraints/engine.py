from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Set

from backend.engines.layout.generator import GeneratedRoom, Layout
from backend.engines.layout.models import Door


@dataclass(frozen=True)
class ConstraintViolation:
    code: str
    message: str


class ConstraintEngine:
    def check_connectivity(
        self,
        layout: Layout,
        doors: List[Door],
    ) -> tuple[bool, List[ConstraintViolation]]:
        rooms = layout.rooms
        if not rooms:
            return False, [ConstraintViolation(code="HC_CONNECTIVITY", message="No rooms in layout.")]

        # Determine entrance room from exterior door or fallback heuristic.
        entrance = _find_entrance_room_name(rooms, doors)
        if not entrance:
            return False, [
                ConstraintViolation(
                    code="HC_CONNECTIVITY",
                    message="No entrance room could be determined for connectivity check.",
                )
            ]

        habitable: Set[str] = {
            r.name for r in rooms if _is_habitable(r.name, r.category)
        }
        if not habitable:
            return True, []

        graph: Dict[str, List[str]] = {r.name: [] for r in rooms}
        for d in doors:
            if d.room_b is None:
                continue
            if d.room_a not in graph or d.room_b not in graph:
                continue
            graph[d.room_a].append(d.room_b)
            graph[d.room_b].append(d.room_a)

        visited = _bfs(graph, entrance)

        unreachable = sorted(name for name in habitable if name not in visited)
        if unreachable:
            msg = f"Habitible rooms not reachable from entrance: {', '.join(unreachable)}"
            return False, [ConstraintViolation(code="HC_CONNECTIVITY", message=msg)]

        return True, []


def _is_habitable(name: str, category: str) -> bool:
    n = (name or "").lower()
    c = (category or "").lower()
    if "bath" in n or "wc" in n or "toilet" in n:
        return False
    if "store" in n or "storage" in n:
        return False
    # treat public and private as habitable; service may or may not be
    if c in {"public", "private"}:
        return True
    if "kitchen" in n:
        return True
    return True


def _find_entrance_room_name(
    rooms: Iterable[GeneratedRoom],
    doors: List[Door],
) -> str:
    # Prefer room that has an exterior door
    for d in doors:
        if d.room_b is None:
            return d.room_a

    # Fallback: first living-like room
    living_like = [r for r in rooms if "living" in r.name.lower()]
    if living_like:
        return living_like[0].name

    # Final fallback: first room
    for r in rooms:
        return r.name
    return ""


def _bfs(graph: Dict[str, List[str]], start: str) -> Set[str]:
    seen: Set[str] = set()
    if start not in graph:
        return seen
    queue: List[str] = [start]
    seen.add(start)
    while queue:
        cur = queue.pop(0)
        for nb in graph.get(cur, []):
            if nb in seen:
                continue
            seen.add(nb)
            queue.append(nb)
    return seen

