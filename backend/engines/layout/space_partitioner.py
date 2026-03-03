from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from shapely.geometry import LineString, Polygon
from shapely.ops import split

from backend.utils.geo_utils import safe_largest_polygon


@dataclass(frozen=True)
class Cell:
    polygon: Polygon
    last_axis: str | None = None  # "vertical" | "horizontal"


class SpacePartitioner:
    def partition(self, buildable: Polygon, n_cells: int, seed: int) -> list[Cell]:
        if n_cells <= 0:
            raise ValueError("n_cells must be >= 1")
        if n_cells == 1:
            return [Cell(polygon=buildable)]

        rng = np.random.default_rng(int(seed))
        cells: list[Cell] = [Cell(polygon=buildable)]

        max_iterations = 2000
        iterations = 0

        while len(cells) < n_cells and iterations < max_iterations:
            iterations += 1
            # split the largest cell first for stability
            cells.sort(key=lambda c: c.polygon.area, reverse=True)
            cell = cells.pop(0)
            poly = cell.polygon

            # choose weighted random split orientation, biased by bbox and last axis
            min_x, min_y, max_x, max_y = poly.bounds
            w = max_x - min_x
            h = max_y - min_y
            if w <= 1e-6 or h <= 1e-6:
                cells.append(cell)
                break

            aspect = w / h if h > 1e-6 else 1.0
            # base probability of vertical split
            if aspect > 1.3:
                p_vertical = 0.7
            elif aspect < 0.77:
                p_vertical = 0.3
            else:
                p_vertical = 0.5

            # avoid repeatedly splitting along the same axis for this cell lineage
            if cell.last_axis == "vertical":
                p_vertical = max(0.1, p_vertical - 0.25)
            elif cell.last_axis == "horizontal":
                p_vertical = min(0.9, p_vertical + 0.25)

            vertical = bool(rng.random() < p_vertical)
            if vertical:
                ratio = float(rng.uniform(0.3, 0.7))
                x = min_x + ratio * w
                line = LineString([(x, min_y - 1.0), (x, max_y + 1.0)])
                axis = "vertical"
            else:
                ratio = float(rng.uniform(0.3, 0.7))
                y = min_y + ratio * h
                line = LineString([(min_x - 1.0, y), (max_x + 1.0, y)])
                axis = "horizontal"

            try:
                parts = split(poly, line)
            except Exception:
                cells.append(cell)
                continue

            polys = [safe_largest_polygon(g) for g in getattr(parts, "geoms", [])]
            polys = [p for p in polys if p is not None and not p.is_empty and p.area > 1e-4]

            if len(polys) < 2:
                cells.append(cell)
                continue

            # keep the two largest parts
            polys.sort(key=lambda p: p.area, reverse=True)
            a, b = polys[0], polys[1]

            # reject extreme slivers more aggressively
            if min(a.area, b.area) / max(a.area, b.area) < 0.08:
                cells.append(cell)
                continue

            cells.extend(
                [
                    Cell(polygon=a, last_axis=axis),
                    Cell(polygon=b, last_axis=axis),
                ]
            )

        if len(cells) != n_cells:
            # If we couldn't reach exact count, keep the largest cells
            cells.sort(key=lambda c: c.polygon.area, reverse=True)
            cells = cells[:n_cells]

        return cells

