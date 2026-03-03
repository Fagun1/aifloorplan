"use client";

import React, { useMemo } from "react";
import { Circle, Layer, Rect } from "react-konva";
import { getFurnitureForRoom } from "@/components/layout/premium/furnitureUtils";
import { TOKENS } from "@/studio/tokens";
import type { LayoutCandidate } from "@/lib/types";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
  scale: number;
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

const FURNITURE_OPACITY = 0.6;

export const FurnitureLayer = React.memo(function FurnitureLayer({
  candidate,
  view,
}: Props) {
  const pieces = useMemo(() => {
    if (!candidate?.rooms) return [];
    const list: { key: string; type: "rect" | "circle"; screen: Record<string, number> }[] = [];
    for (const room of candidate.rooms) {
      const furniture = getFurnitureForRoom(
        room.name,
        room.category,
        room.polygon,
        room.area_m2
      );
      furniture.forEach((piece, i) => {
        const s = view.scale;
        if (piece.type === "rect") {
          const [sx, sy] = view.toScreen([piece.x, piece.y]);
          list.push({
            key: `${room.name}-r-${i}`,
            type: "rect",
            screen: {
              x: sx,
              y: sy,
              w: piece.width * s,
              h: piece.height * s,
              r: piece.cornerRadius != null && piece.cornerRadius >= 2 ? piece.cornerRadius : (piece.cornerRadius ?? 0) * s,
            },
          });
        } else {
          const [sx, sy] = view.toScreen([piece.x, piece.y]);
          list.push({
            key: `${room.name}-c-${i}`,
            type: "circle",
            screen: { x: sx, y: sy, r: piece.radius * s },
          });
        }
      });
    }
    return list;
  }, [candidate, view]);

  if (pieces.length === 0) return null;

  return (
    <Layer listening={false}>
      {pieces.map(({ key, type, screen }) =>
        type === "rect" ? (
          <Rect
            key={key}
            x={screen.x}
            y={screen.y}
            width={screen.w}
            height={screen.h}
            fill={TOKENS.FURNITURE_FILL}
            stroke={TOKENS.FURNITURE_STROKE}
            strokeWidth={1}
            cornerRadius={screen.r ?? 0}
            opacity={FURNITURE_OPACITY}
            listening={false}
          />
        ) : (
          <Circle
            key={key}
            x={screen.x}
            y={screen.y}
            radius={screen.r}
            fill={TOKENS.FURNITURE_FILL}
            stroke={TOKENS.FURNITURE_STROKE}
            strokeWidth={1}
            opacity={FURNITURE_OPACITY}
            listening={false}
          />
        )
      )}
    </Layer>
  );
});
