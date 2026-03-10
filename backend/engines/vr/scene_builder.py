"""
VR Scene Builder Engine — converts 2D room layout to 3D scene data for Three.js.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


# ── Material & Lighting Palettes ───────────────────────────────────────────

ROOM_MATERIALS: dict[str, dict[str, Any]] = {
    "living":    {"wall": "#F5F0E8", "floor": "#C8A876", "ceiling": "#FFFEFA", "roughness": 0.8, "metalness": 0.0},
    "bedroom":   {"wall": "#E8EFF5", "floor": "#8B6F47", "ceiling": "#FFFEFA", "roughness": 0.9, "metalness": 0.0},
    "kitchen":   {"wall": "#F0F4EE", "floor": "#A0A0A0", "ceiling": "#FFFEFA", "roughness": 0.5, "metalness": 0.2},
    "bathroom":  {"wall": "#E6F0F4", "floor": "#B0C4CC", "ceiling": "#FFFEFA", "roughness": 0.3, "metalness": 0.3},
    "dining":    {"wall": "#F4EEE0", "floor": "#B8976A", "ceiling": "#FFFEFA", "roughness": 0.7, "metalness": 0.0},
    "study":     {"wall": "#EEE8E0", "floor": "#8B7355", "ceiling": "#FFFEFA", "roughness": 0.8, "metalness": 0.0},
    "garage":    {"wall": "#D8D8D8", "floor": "#808080", "ceiling": "#E0E0E0", "roughness": 1.0, "metalness": 0.0},
    "corridor":  {"wall": "#F0EDE8", "floor": "#A09070", "ceiling": "#FFFEFA", "roughness": 0.8, "metalness": 0.0},
    "default":   {"wall": "#F0EDE8", "floor": "#A09070", "ceiling": "#FFFEFA", "roughness": 0.8, "metalness": 0.0},
}

CATEGORY_LIGHTING: dict[str, dict[str, Any]] = {
    "public":  {"ambient": 0.6, "point_intensity": 1.2, "color": "#FFF5E0", "shadows": True},
    "private": {"ambient": 0.4, "point_intensity": 0.9, "color": "#FFF0D5", "shadows": True},
    "service": {"ambient": 0.7, "point_intensity": 1.4, "color": "#FFFFFF", "shadows": False},
}

FURNITURE_TEMPLATES: dict[str, list[dict]] = {
    "living":   [
        {"type": "sofa",        "w": 2.4, "d": 0.9, "h": 0.85, "placement": "center_offset"},
        {"type": "coffee_table","w": 1.2, "d": 0.6, "h": 0.45, "placement": "front_sofa"},
        {"type": "tv_unit",     "w": 1.8, "d": 0.4, "h": 0.5,  "placement": "wall_north"},
    ],
    "bedroom":  [
        {"type": "bed",         "w": 1.8, "d": 2.0, "h": 0.6,  "placement": "center_offset"},
        {"type": "wardrobe",    "w": 2.0, "d": 0.6, "h": 2.2,  "placement": "wall_east"},
        {"type": "nightstand",  "w": 0.5, "d": 0.45,"h": 0.55, "placement": "beside_bed"},
    ],
    "kitchen":  [
        {"type": "counter",     "w": 2.5, "d": 0.6, "h": 0.9,  "placement": "wall_south"},
        {"type": "island",      "w": 1.2, "d": 0.8, "h": 0.9,  "placement": "center"},
    ],
    "dining":   [
        {"type": "dining_table","w": 1.6, "d": 0.9, "h": 0.75, "placement": "center"},
        {"type": "chairs",      "w": 0.5, "d": 0.5, "h": 0.9,  "placement": "around_table", "count": 4},
    ],
    "bathroom": [
        {"type": "toilet",      "w": 0.4, "d": 0.7, "h": 0.8,  "placement": "wall_corner"},
        {"type": "sink",        "w": 0.5, "d": 0.4, "h": 0.85, "placement": "wall_north"},
        {"type": "bathtub",     "w": 0.75,"d": 1.6, "h": 0.55, "placement": "wall_east"},
    ],
}


# ── Scene Building ─────────────────────────────────────────────────────────

def build_vr_scene(candidate: dict, floor_number: int = 0) -> dict:
    """
    Convert a layout candidate (rooms with 2D polygons) to a full 3D scene
    suitable for rendering in Three.js / React Three Fiber.
    """
    rooms = candidate.get("rooms", [])
    floor_rooms = [r for r in rooms if r.get("floor_number", 0) == floor_number]

    scene_rooms = []
    all_lights = []
    scene_bounds = _compute_bounds(floor_rooms)

    for room in floor_rooms:
        room_type = room.get("name", "default").lower().split()[0]
        category = room.get("category", "public")
        polygon = room.get("polygon", [])
        centroid = room.get("centroid", [0, 0])
        area = room.get("area_m2", 20)

        # Determine bounding box from polygon
        bbox = _polygon_bbox(polygon)
        width = bbox["width"]
        depth = bbox["depth"]
        cx, cy = centroid[0], centroid[1]

        mat_key = room_type if room_type in ROOM_MATERIALS else "default"
        material = ROOM_MATERIALS[mat_key]
        lighting = CATEGORY_LIGHTING.get(category, CATEGORY_LIGHTING["public"])

        # Ceiling height estimate based on area
        ceiling_h = 2.8 if area < 30 else 3.0

        # Furniture
        furniture = _place_furniture(room_type, cx, cy, width, depth, floor_number)

        # Doors from candidate
        room_doors = [
            d for d in candidate.get("doors", [])
            if d.get("from_room") == room.get("name") or d.get("to_room") == room.get("name")
        ]

        scene_room = {
            "id": f"room_{room.get('name', 'unknown').replace(' ', '_')}",
            "name": room.get("name"),
            "category": category,
            "floor": floor_number,
            # 3D transform
            "position": [cx, floor_number * (ceiling_h + 0.2), cy],
            "size": [width, ceiling_h, depth],
            "polygon_2d": polygon,
            # Materials
            "material": material,
            # Lighting for this room
            "light": {
                "position": [cx, floor_number * (ceiling_h + 0.2) + ceiling_h - 0.3, cy],
                "intensity": lighting["point_intensity"],
                "color": lighting["color"],
                "cast_shadow": lighting["shadows"],
            },
            # Furniture list
            "furniture": furniture,
            # Doors
            "doors": room_doors,
        }
        scene_rooms.append(scene_room)

        all_lights.append(scene_room["light"])

    return {
        "scene_version": "1.0",
        "floor_number": floor_number,
        "rooms": scene_rooms,
        "ambient_light": {"intensity": 0.35, "color": "#FFFFFF"},
        "sun_light": {
            "direction": [50, 100, 30],
            "intensity": 1.0,
            "color": "#FFF5E0",
            "cast_shadow": True,
        },
        "sky": {"type": "gradient", "top": "#87CEEB", "bottom": "#FFFFFF"},
        "bounds": scene_bounds,
        "stats": {
            "room_count": len(scene_rooms),
            "total_area_m2": sum(r.get("area_m2", 0) for r in floor_rooms),
            "furniture_count": sum(len(r["furniture"]) for r in scene_rooms),
        },
    }


def _polygon_bbox(polygon: list) -> dict:
    if not polygon:
        return {"width": 5.0, "depth": 5.0, "min_x": 0, "min_y": 0, "max_x": 5, "max_y": 5}
    xs = [p[0] for p in polygon]
    ys = [p[1] for p in polygon]
    return {
        "min_x": min(xs), "max_x": max(xs),
        "min_y": min(ys), "max_y": max(ys),
        "width": max(xs) - min(xs),
        "depth": max(ys) - min(ys),
    }


def _compute_bounds(rooms: list) -> dict:
    if not rooms:
        return {"min_x": 0, "max_x": 10, "min_y": 0, "max_y": 10}
    all_pts = [p for r in rooms for p in r.get("polygon", [])]
    if not all_pts:
        return {"min_x": 0, "max_x": 10, "min_y": 0, "max_y": 10}
    xs, ys = [p[0] for p in all_pts], [p[1] for p in all_pts]
    return {"min_x": min(xs), "max_x": max(xs), "min_y": min(ys), "max_y": max(ys)}


def _place_furniture(
    room_type: str,
    cx: float, cy: float,
    room_w: float, room_d: float,
    floor_number: int,
) -> list[dict]:
    templates = FURNITURE_TEMPLATES.get(room_type, [])
    placed = []
    wall_n = cy + room_d / 2 - 0.3
    wall_s = cy - room_d / 2 + 0.3
    wall_e = cx + room_w / 2 - 0.3
    floor_y = floor_number * 3.2

    for tmpl in templates:
        fw, fd, fh = tmpl["w"], tmpl["d"], tmpl["h"]
        placement = tmpl.get("placement", "center")

        if placement == "center":
            pos = [cx, floor_y, cy]
        elif placement == "center_offset":
            pos = [cx, floor_y, cy + room_d * 0.1]
        elif placement == "wall_north":
            pos = [cx, floor_y, wall_n - fd / 2]
        elif placement == "wall_south":
            pos = [cx, floor_y, wall_s + fd / 2]
        elif placement == "wall_east":
            pos = [wall_e - fw / 2, floor_y, cy]
        elif placement == "wall_corner":
            pos = [wall_e - fw / 2, floor_y, wall_n - fd / 2]
        elif placement == "front_sofa":
            pos = [cx, floor_y, cy + room_d * 0.1 + 0.8]
        elif placement == "beside_bed":
            pos = [cx + 1.1, floor_y, cy + room_d * 0.1]
        elif placement == "around_table":
            # Handled separately — skip here, insert chairs below
            count = tmpl.get("count", 4)
            for i in range(count):
                angle = (2 * math.pi * i) / count
                r_dist = max(fw, fd) * 0.65
                chair_x = cx + math.cos(angle) * r_dist
                chair_z = cy + math.sin(angle) * r_dist
                placed.append({
                    "type": "chair",
                    "position": [chair_x, floor_y, chair_z],
                    "rotation_y": math.degrees(angle) + 180,
                    "size": [0.5, 0.9, 0.5],
                    "color": "#8B6F47",
                })
            continue
        else:
            pos = [cx, floor_y, cy]

        placed.append({
            "type": tmpl["type"],
            "position": pos,
            "rotation_y": 0,
            "size": [fw, fh, fd],
            "color": _furniture_color(tmpl["type"]),
        })

    return placed


def _furniture_color(furniture_type: str) -> str:
    colors = {
        "sofa": "#6B7FA3", "bed": "#8B7355", "wardrobe": "#6B5A45",
        "coffee_table": "#8B6914", "tv_unit": "#2C2C2C", "dining_table": "#8B6F47",
        "counter": "#C0C0C0", "island": "#D0D0D0", "toilet": "#FFFFFF",
        "sink": "#E0E0E0", "bathtub": "#F0F8FF", "nightstand": "#8B7355",
    }
    return colors.get(furniture_type, "#A0A0A0")
