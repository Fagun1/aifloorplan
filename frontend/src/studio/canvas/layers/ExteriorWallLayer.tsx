"use client";

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import { getWallSegments } from "@/components/layout/premium/wallUtils";
import { TOKENS } from "@/studio/tokens";
import type { LayoutCandidate } from "@/lib/types";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  candidate: LayoutCandidate | null;
  buildablePolygon: [number, number][];
  view: ViewTransform;
};

function flat(p1: [number, number], p2: [number, number]): number[] {
  return [p1[0], p1[1], p2[0], p2[1]];
}

export const ExteriorWallLayer = React.memo(function ExteriorWallLayer({
  candidate,
  buildablePolygon,
  view,
}: Props) {
  const segments = useMemo(() => {
    const walls = getWallSegments(candidate, buildablePolygon);
    return walls
      .filter((s) => s.isExterior)
      .map(({ p1, p2 }, i) => ({
        key: `ext-${i}-${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`,
        points: flat(view.toScreen(p1), view.toScreen(p2)),
      }));
  }, [candidate, buildablePolygon, view]);

  if (segments.length === 0) return null;

  return (
    <Layer listening={false}>
      {segments.map(({ key, points }) => (
        <Line
          key={key}
          points={points}
          stroke={TOKENS.WALL_EXTERIOR}
          strokeWidth={10}
          lineJoin="miter"
          lineCap="square"
          listening={false}
        />
      ))}
    </Layer>
  );
});
