import type { LayoutCandidate } from "@/lib/types";
import {
  minDimensionBoundingBox,
  polygonInsidePolygon,
  polygonsOverlap,
  type Point,
} from "@/lib/geometry";

export type RoomViolations = Record<string, string[]>;

type ValidateOptions = {
  minDimensionM?: number;
};

export function validateCandidateConstraints(
  candidate: LayoutCandidate,
  buildablePolygon: Point[],
  opts: ValidateOptions = {},
): RoomViolations {
  const minDim = opts.minDimensionM ?? 2.0;
  const result: RoomViolations = {};

  const rooms = candidate.rooms;

  // Per-room checks
  for (const room of rooms) {
    const reasons: string[] = [];

    if (!polygonInsidePolygon(room.polygon, buildablePolygon)) {
      reasons.push("outside_buildable");
    }

    if (minDimensionBoundingBox(room.polygon) < minDim) {
      reasons.push("min_dimension_below_2m");
    }

    if (reasons.length) {
      result[room.name] = reasons;
    }
  }

  // Overlap checks
  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const ri = rooms[i];
      const rj = rooms[j];
      if (polygonsOverlap(ri.polygon, rj.polygon)) {
        const msgI = `overlaps_with:${rj.name}`;
        const msgJ = `overlaps_with:${ri.name}`;
        if (!result[ri.name]) result[ri.name] = [];
        if (!result[ri.name].includes(msgI)) result[ri.name].push(msgI);
        if (!result[rj.name]) result[rj.name] = [];
        if (!result[rj.name].includes(msgJ)) result[rj.name].push(msgJ);
      }
    }
  }

  return result;
}

