from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from shapely.geometry import Polygon
from shapely.geometry.polygon import orient

from backend.api.v1.schemas.common import BBox
from backend.utils.geo_utils import safe_largest_polygon


@dataclass(frozen=True)
class ValidatedPolygon:
    polygon: Polygon


class GeometryEngine:
    """Geometry computations: polygon validation, setback, buildable area."""

    def validate_polygon(self, points: list) -> ValidatedPolygon:
        """
        Validate a polygon and return a ValidatedPolygon object.
        Used by pipeline.py. Raises ValueError on invalid input.
        """
        if len(points) < 3:
            raise ValueError("Polygon must have at least 3 points.")
        poly = Polygon(points)
        if poly.is_empty:
            raise ValueError("Polygon is empty.")
        if not poly.is_valid:
            raise ValueError("Polygon is not valid (self-intersection or degeneracy).")
        if poly.area <= 0:
            raise ValueError("Polygon area must be > 0.")
        poly = orient(poly, sign=1.0)  # CCW
        return ValidatedPolygon(polygon=poly)

    def validate_polygon_dict(self, points: list) -> dict[str, Any]:
        """
        Validate a polygon and return a dict with is_valid, issues, area, perimeter.
        Used by plots.py route.
        """
        issues: list[str] = []
        try:
            if len(points) < 3:
                return {"is_valid": False, "issues": ["Polygon must have at least 3 points"]}
            poly = Polygon(points)
            if poly.is_empty:
                issues.append("Polygon is empty")
            if not poly.is_valid:
                issues.append("Polygon self-intersects or is degenerate")
            if poly.area <= 0:
                issues.append("Polygon area must be > 0")
            return {
                "is_valid": len(issues) == 0,
                "issues": issues,
                "area": float(poly.area),
                "perimeter": float(poly.length),
            }
        except Exception as e:
            return {"is_valid": False, "issues": [str(e)]}

    def compute_buildable_area(
        self, points: list, setback_m: float = 1.0
    ) -> list[list[float]] | None:
        """
        Apply uniform setback to polygon, return list of [x,y] vertices
        of the buildable (inner) polygon, or None if no area remains.
        """
        try:
            poly = Polygon(points)
            if poly.is_empty or not poly.is_valid:
                poly = poly.buffer(0)
            if setback_m <= 0:
                return [list(p) for p in poly.exterior.coords[:-1]]
            inner = poly.buffer(-float(setback_m))
            largest = safe_largest_polygon(inner)
            if largest is None or largest.is_empty or largest.area <= 0:
                return None
            largest = orient(largest, sign=1.0)
            return [list(p) for p in largest.exterior.coords[:-1]]
        except Exception:
            return None

    def area(self, validated: ValidatedPolygon) -> float:
        return float(validated.polygon.area)

    def bounding_box(self, validated: ValidatedPolygon) -> BBox:
        min_x, min_y, max_x, max_y = validated.polygon.bounds
        return BBox(min_x=float(min_x), min_y=float(min_y), max_x=float(max_x), max_y=float(max_y))

    def setback(self, validated: ValidatedPolygon, setback_m: float) -> ValidatedPolygon:
        if setback_m < 0:
            raise ValueError("setback_m must be >= 0.")
        if setback_m == 0:
            return validated
        buffered = validated.polygon.buffer(-float(setback_m))
        largest = safe_largest_polygon(buffered)
        if largest is None or largest.is_empty or largest.area <= 0:
            raise ValueError("Setback too large; no buildable area remains.")
        if not largest.is_valid:
            largest = largest.buffer(0)
        largest = safe_largest_polygon(largest)
        if largest is None or largest.is_empty or largest.area <= 0:
            raise ValueError("Setback resulted in invalid buildable area.")
        largest = orient(largest, sign=1.0)
        return ValidatedPolygon(polygon=largest)
