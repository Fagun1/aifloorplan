"use client";

import React, { useMemo } from "react";
import { Layer, Text } from "react-konva";
import { TOKENS } from "@/studio/tokens";
import type { LayoutCandidate } from "@/lib/types";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

const MIN_AREA_M2 = 6;

export const LabelLayer = React.memo(function LabelLayer({
  candidate,
  view,
}: Props) {
  const labels = useMemo(() => {
    if (!candidate?.rooms) return [];
    return candidate.rooms
      .filter((r) => r.area_m2 >= MIN_AREA_M2)
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
          fontSize={11}
          fontStyle="500"
          fill={TOKENS.LABEL_PRIMARY}
          letterSpacing={2}
          align="center"
          verticalAlign="middle"
          offsetX={(text.length * 11 * 0.5) / 2}
          offsetY={11 / 2}
          listening={false}
        />
      ))}
    </Layer>
  );
});
