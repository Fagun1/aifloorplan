/**
 * Derive wall segments from room polygons and adjacency.
 * Exterior vs interior hierarchy; door cutouts so walls don't draw through doors.
 */

import type { LayoutCandidate } from "@/lib/types";
import type { Point } from "@/lib/geometry";

const EPS = 1e-6;

function segKey(p1: Point, p2: Point): string {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const first = x1 < x2 - EPS || (Math.abs(x1 - x2) <= EPS && y1 <= y2) ? p1 : p2;
  const second = first === p1 ? p2 : p1;
  return `${first[0]},${first[1]}-${second[0]},${second[1]}`;
}

function segEqual(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d1 = Math.hypot(a1[0] - b1[0], a1[1] - b1[1]);
  const d2 = Math.hypot(a2[0] - b2[0], a2[1] - b2[1]);
  if (d1 < EPS && d2 < EPS) return true;
  const d1r = Math.hypot(a1[0] - b2[0], a1[1] - b2[1]);
  const d2r = Math.hypot(a2[0] - b1[0], a2[1] - b1[1]);
  return d1r < EPS && d2r < EPS;
}

export type WallSegment = { p1: Point; p2: Point; isExterior: boolean };

/**
 * Project point onto segment p1-p2. Returns t in [0,1] and distance from point to line.
 */
function projectOntoSegment(
  px: number,
  py: number,
  p1: Point,
  p2: Point,
): { t: number; dist: number } {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const dist = Math.hypot(px - projX, py - projY);
  return { t, dist };
}

/**
 * Split segment at door: return [leftSegment, rightSegment] or null if door not on this segment.
 * Door sits at position; we remove a gap of doorWidth centered at position along the segment.
 */
function splitSegmentAtDoor(
  p1: Point,
  p2: Point,
  doorX: number,
  doorY: number,
  doorWidth: number,
): WallSegment[] | null {
  const { t, dist } = projectOntoSegment(doorX, doorY, p1, p2);
  if (dist > 0.5) return null;
  if (t <= EPS || t >= 1 - EPS) return null;

  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1e-9;
  const ux = dx / len;
  const uy = dy / len;
  const half = doorWidth / 2;

  const leftEnd: Point = [doorX - ux * half, doorY - uy * half];
  const rightStart: Point = [doorX + ux * half, doorY + uy * half];

  const segLen = len;
  if (Math.hypot(leftEnd[0] - x1, leftEnd[1] - y1) < 0.05) return null;
  if (Math.hypot(rightStart[0] - x2, rightStart[1] - y2) < 0.05) return null;

  return [
    { p1, p2: leftEnd, isExterior: false },
    { p1: rightStart, p2, isExterior: false },
  ];
}

/**
 * Returns list of wall segments in world coordinates with exterior/interior flag.
 * Then applies door cutouts: segments that contain a door are split into left + right (gap not drawn).
 */
export function getWallSegments(
  candidate: LayoutCandidate | null,
  buildablePolygon: [number, number][],
): WallSegment[] {
  if (!candidate?.rooms?.length) return [];

  const roomByName = new Map(candidate.rooms.map((r) => [r.name, r]));
  const addedSharedKeys = new Set<string>();
  const allEdges: WallSegment[] = [];

  for (const room of candidate.rooms) {
    const poly = room.polygon;
    const neighbors = candidate.adjacency_matrix[room.name] ?? [];

    for (let i = 0; i < poly.length; i += 1) {
      const p1 = poly[i] as Point;
      const p2 = poly[(i + 1) % poly.length] as Point;
      const key = segKey(p1, p2);

      let isShared = false;
      for (const n of neighbors) {
        const other = roomByName.get(n);
        if (!other) continue;
        for (let j = 0; j < other.polygon.length; j += 1) {
          const o1 = other.polygon[j] as Point;
          const o2 = other.polygon[(j + 1) % other.polygon.length] as Point;
          if (segEqual(p1, p2, o1, o2)) {
            isShared = true;
            break;
          }
        }
        if (isShared) break;
      }

      const isExterior = !isShared;

      if (isShared) {
        if (!addedSharedKeys.has(key)) {
          addedSharedKeys.add(key);
          allEdges.push({ p1, p2, isExterior: false });
        }
      } else {
        allEdges.push({ p1, p2, isExterior });
      }
    }
  }

  const doors = candidate.doors ?? [];
  if (doors.length === 0) return allEdges;

  const result: WallSegment[] = [];
  for (const seg of allEdges) {
    let replaced = false;
    for (const d of doors) {
      const [px, py] = d.position;
      const doorW = Number(d.width) || 0.9;
      const split = splitSegmentAtDoor(seg.p1, seg.p2, px, py, doorW);
      if (split) {
        result.push(...split.map((s) => ({ ...s, isExterior: seg.isExterior })));
        replaced = true;
        break;
      }
    }
    if (!replaced) result.push(seg);
  }
  return result;
}
