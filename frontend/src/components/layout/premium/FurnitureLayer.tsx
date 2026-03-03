"use client";

import React, { useMemo } from "react";
import { Circle, Layer, Rect } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { getFurnitureForRoom, type FurniturePiece } from "./furnitureUtils";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
  scale: number;
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

/**
 * Symbolic furniture per room type. Deterministic placement from centroid / longest wall.
 */
export const FurnitureLayer = React.memo(function FurnitureLayer({
  candidate,
  view,
}: Props) {
  const normalizedPieces = useMemo(() => {
    if (!candidate?.rooms) return [];
    const list: {
      key: string;
      piece: FurniturePiece;
      screen: { x: number; y: number; w: number; h: number; r: number; scale: number };
    }[] = [];
    for (const room of candidate.rooms) {
      const furniture = getFurnitureForRoom(
        room.name,
        room.category,
        room.polygon,
        room.area_m2,
      );
      furniture.forEach((piece, i) => {
        const s = view.scale;
        if (piece.type === "rect") {
          const [sx, sy] = view.toScreen([piece.x, piece.y]);
          list.push({
            key: `${room.name}-r-${i}`,
            piece,
            screen: {
              x: sx,
              y: sy,
              w: piece.width * s,
              h: piece.height * s,
              r: 0,
              scale: s,
            },
          });
        } else {
          const [sx, sy] = view.toScreen([piece.x, piece.y]);
          list.push({
            key: `${room.name}-c-${i}`,
            piece,
            screen: {
              x: sx,
              y: sy,
              w: 0,
              h: 0,
              r: piece.radius * s,
              scale: s,
            },
          });
        }
      });
    }
    return list;
  }, [candidate, view]);

  if (normalizedPieces.length === 0) return null;

  return (
    <Layer listening={false}>
      {normalizedPieces.map(({ key, piece, screen }) =>
        piece.type === "rect" ? (
          <Rect
            key={key}
            x={screen.x}
            y={screen.y}
            width={screen.w}
            height={screen.h}
            fill={piece.fill}
            cornerRadius={piece.cornerRadius != null ? (piece.cornerRadius >= 2 ? piece.cornerRadius : piece.cornerRadius * screen.scale) : 0}
            opacity={piece.opacity ?? 1}
            listening={false}
          />
        ) : (
          <Circle
            key={key}
            x={screen.x}
            y={screen.y}
            radius={screen.r}
            fill={piece.fill}
            opacity={piece.opacity ?? 1}
            listening={false}
          />
        ),
      )}
    </Layer>
  );
});
