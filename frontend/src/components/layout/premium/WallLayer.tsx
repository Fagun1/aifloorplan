"use client";

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { getWallSegments } from "./wallUtils";
import { WALL, WALL_EXTERIOR, WALL_INTERIOR } from "./constants";

function flat(p1: [number, number], p2: [number, number]): number[] {
  return [p1[0], p1[1], p2[0], p2[1]];
}

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  candidate: LayoutCandidate | null;
  buildablePolygon: [number, number][];
  view: ViewTransform;
};

/**
 * Wall layer: exterior thicker/darker, interior lighter. Door cutouts applied in wallUtils.
 */
export const WallLayer = React.memo(function WallLayer({
  candidate,
  buildablePolygon,
  view,
}: Props) {
  const segments = useMemo(() => {
    const walls = getWallSegments(candidate, buildablePolygon);
    return walls.map(({ p1, p2, isExterior }, i) => ({
      key: `${i}-${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`,
      points: flat(view.toScreen(p1), view.toScreen(p2)),
      isExterior,
    }));
  }, [candidate, buildablePolygon, view]);

  if (segments.length === 0) return null;

  return (
    <Layer listening={false}>
      {segments.map(({ key, points, isExterior }) => (
        <Line
          key={key}
          points={points}
          stroke={isExterior ? WALL_EXTERIOR.STROKE : WALL_INTERIOR.STROKE}
          strokeWidth={isExterior ? WALL_EXTERIOR.STROKE_WIDTH : WALL_INTERIOR.STROKE_WIDTH}
          lineJoin={WALL.LINE_JOIN}
          lineCap="square"
          shadowColor={WALL.SHADOW_COLOR}
          shadowBlur={WALL.SHADOW_BLUR}
          shadowOpacity={WALL.SHADOW_OPACITY}
          shadowOffset={{ x: WALL.SHADOW_OFFSET_X, y: WALL.SHADOW_OFFSET_Y }}
          listening={false}
        />
      ))}
    </Layer>
  );
});
