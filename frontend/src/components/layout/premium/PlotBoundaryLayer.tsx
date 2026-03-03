"use client";

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import { PLOT } from "./constants";

function flat(pts: [number, number][]): number[] {
  const out: number[] = [];
  for (const [x, y] of pts) out.push(x, y);
  return out;
}

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  buildablePolygon: [number, number][];
  view: ViewTransform;
};

/**
 * Plot/buildable boundary outline. Renders at back of stack.
 */
export const PlotBoundaryLayer = React.memo(function PlotBoundaryLayer({
  buildablePolygon,
  view,
}: Props) {
  const points = useMemo(
    () => flat(buildablePolygon.map(view.toScreen)),
    [buildablePolygon, view],
  );

  if (points.length < 4) return null;

  return (
    <Layer listening={false}>
      <Line
        points={points}
        closed
        stroke={PLOT.STROKE}
        strokeWidth={PLOT.STROKE_WIDTH}
        lineJoin="miter"
        listening={false}
      />
    </Layer>
  );
});
