from __future__ import annotations

from shapely.geometry import Polygon


def polygon_to_coords(poly: Polygon) -> list[tuple[float, float]]:
    coords = list(poly.exterior.coords)
    if len(coords) >= 2 and coords[0] == coords[-1]:
        coords = coords[:-1]
    return [(float(x), float(y)) for x, y in coords]


def safe_largest_polygon(geom):
    if geom is None:
        return None
    if geom.geom_type == "Polygon":
        return geom
    if geom.geom_type == "MultiPolygon":
        polys = list(geom.geoms)
        if not polys:
            return None
        return max(polys, key=lambda p: p.area)
    return None

