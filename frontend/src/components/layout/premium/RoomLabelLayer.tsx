"use client";

import React, { useMemo } from "react";
import { Layer, Text } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { LABEL } from "./constants";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

/**
 * Room labels: uppercase, medium weight. Centered in room.
 */
export const RoomLabelLayer = React.memo(function RoomLabelLayer({
  candidate,
  view,
}: Props) {
  const labels = useMemo(() => {
    if (!candidate?.rooms) return [];
    return candidate.rooms
      .filter((r) => r.area_m2 >= LABEL.MIN_AREA_M2)
      .map((r) => {
        const [x, y] = view.toScreen(r.centroid);
        return { key: r.name, text: r.name.toUpperCase(), x, y };
      });
  }, [candidate, view]);

  if (labels.length === 0) return null;

  return (
    <Layer listening={false}>
      {labels.map(({ key, text, x, y }) => (
        <Text
          key={key}
          x={x}
          y={y}
          text={text}
          fontSize={LABEL.FONT_SIZE}
          fontStyle={LABEL.FONT_STYLE}
          fill={LABEL.FILL}
          letterSpacing={LABEL.LETTER_SPACING}
          opacity={LABEL.OPACITY}
          align="center"
          verticalAlign="middle"
          offsetX={(text.length * LABEL.FONT_SIZE * 0.5) / 2}
          offsetY={LABEL.FONT_SIZE / 2}
          listening={false}
        />
      ))}
    </Layer>
  );
});