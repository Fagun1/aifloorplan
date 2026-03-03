"use client";

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { ROOM_FILL } from "./constants";

function flat(pts: [number, number][]): number[] {
  const out: number[] = [];
  for (const [x, y] of pts) out.push(x, y);
  return out;
}

function roomFillColor(name: string, category: string): string {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes("living") || c === "public") return ROOM_FILL.LIVING;
  if (n.includes("bed") || n.includes("bedroom") || c === "private") return ROOM_FILL.BEDROOM;
  if (n.includes("kitchen") || c === "service") return ROOM_FILL.KITCHEN;
  if (n.includes("bath") || n.includes("toilet") || n.includes("wc")) return ROOM_FILL.BATHROOM;
  if (n.includes("dining")) return ROOM_FILL.DINING;
  return ROOM_FILL.DEFAULT;
}

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

/**
 * Room fill layer: per-room-type subtle tints (living, bedroom, kitchen, etc.).
 */
export const RoomFillLayer = React.memo(function RoomFillLayer({
  candidate,
  view,
}: Props) {
  const shapes = useMemo(() => {
    if (!candidate?.rooms) return [];
    return candidate.rooms.map((r) => ({
      key: r.name,
      flatPts: flat(r.polygon.map(view.toScreen)),
      fill: roomFillColor(r.name, r.category),
    }));
  }, [candidate, view]);

  if (shapes.length === 0) return null;

  return (
    <Layer listening={false}>
      {shapes.map(({ key, flatPts, fill }) => (
        <Line
          key={key}
          points={flatPts}
          closed
          fill={fill}
          listening={false}
        />
      ))}
    </Layer>
  );
});
