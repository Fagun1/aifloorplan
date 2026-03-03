"use client";

import React, { useMemo } from "react";
import { Circle, Layer, Line } from "react-konva";
import { TOKENS } from "@/studio/tokens";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  polygon: [number, number][];
  view: ViewTransform;
  closed: boolean;
};

function flat(pts: [number, number][], toScreen: (p: [number, number]) => [number, number]): number[] {
  const out: number[] = [];
  for (const p of pts) out.push(...toScreen(p));
  return out;
}

export const PlotLayer = React.memo(function PlotLayer({
  polygon,
  view,
  closed,
}: Props) {
  const flatPts = useMemo(() => flat(polygon, view.toScreen), [polygon, view]);
  const vertices = useMemo(
    () => polygon.map((p) => view.toScreen(p)),
    [polygon, view]
  );

  if (polygon.length === 0) return null;

  return (
    <Layer listening={false}>
      {closed && flatPts.length >= 4 && (
        <Line
          points={flatPts}
          closed
          fill={TOKENS.ACCENT}
          opacity={0.03}
          listening={false}
        />
      )}
      {flatPts.length >= 4 && (
        <Line
          points={flatPts}
          closed={closed}
          stroke={TOKENS.ACCENT}
          strokeWidth={1.5}
          dash={closed ? undefined : [4, 4]}
          listening={false}
        />
      )}
      {vertices.map(([x, y], i) => (
        <Circle
          key={i}
          x={x}
          y={y}
          radius={5}
          fill={TOKENS.ACCENT}
          listening={false}
        />
      ))}
    </Layer>
  );
});
