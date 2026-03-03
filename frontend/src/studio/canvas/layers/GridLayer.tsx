"use client";

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import { TOKENS } from "@/studio/tokens";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
  scale: number;
};

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

type Props = {
  view: ViewTransform;
  bounds: Bounds;
  visible?: boolean;
};

const GRID_SPACING = 1;
const MAJOR_EVERY = 5;

export const GridLayer = React.memo(function GridLayer({
  view,
  bounds,
  visible = true,
}: Props) {
  const lines = useMemo(() => {
    if (!visible) return { minor: [], major: [] };
    const pts: { minor: number[][]; major: number[][] } = { minor: [], major: [] };
    const { minX, maxX, minY, maxY } = bounds;

    for (let x = Math.floor(minX / GRID_SPACING) * GRID_SPACING; x <= maxX; x += GRID_SPACING) {
      const p1 = view.toScreen([x, minY]);
      const p2 = view.toScreen([x, maxY]);
      const arr = x % (GRID_SPACING * MAJOR_EVERY) === 0 ? pts.major : pts.minor;
      arr.push([p1[0], p1[1], p2[0], p2[1]]);
    }
    for (let y = Math.floor(minY / GRID_SPACING) * GRID_SPACING; y <= maxY; y += GRID_SPACING) {
      const p1 = view.toScreen([minX, y]);
      const p2 = view.toScreen([maxX, y]);
      const arr = y % (GRID_SPACING * MAJOR_EVERY) === 0 ? pts.major : pts.minor;
      arr.push([p1[0], p1[1], p2[0], p2[1]]);
    }
    return pts;
  }, [view, bounds, visible]);

  if (!visible) return null;

  return (
    <Layer listening={false}>
      {lines.minor.map((pts, i) => (
        <Line
          key={`m-${i}`}
          points={pts}
          stroke={TOKENS.GRID_LINE}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {lines.major.map((pts, i) => (
        <Line
          key={`M-${i}`}
          points={pts}
          stroke={TOKENS.GRID_LINE_MAJOR}
          strokeWidth={1}
          listening={false}
        />
      ))}
    </Layer>
  );
});
