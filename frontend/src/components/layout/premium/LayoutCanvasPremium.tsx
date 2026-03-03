"use client";

import React, { useMemo, useRef, useState } from "react";
import { Stage } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { PlotBoundaryLayer } from "./PlotBoundaryLayer";
import { RoomFillLayer } from "./RoomFillLayer";
import { FurnitureLayer } from "./FurnitureLayer";
import { WallLayer } from "./WallLayer";
import { DoorLayer } from "./DoorLayer";
import { RoomLabelLayer } from "./RoomLabelLayer";

/** 12% margin each side for breathing room (premium plans never feel tight). */
const CANVAS_PADDING = 0.12;

function bounds(points: [number, number][]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

type Props = {
  plotPolygon: [number, number][];
  buildablePolygon: [number, number][];
  candidate: LayoutCandidate | null;
  width: number;
  height: number;
  showFurniture?: boolean;
};

/**
 * Premium layout canvas: floating white board style.
 * Layer order: Plot Boundary → Room Fill → Furniture → Walls → Doors → Labels.
 */
export function LayoutCanvasPremium({
  plotPolygon,
  buildablePolygon,
  candidate,
  width,
  height,
  showFurniture = true,
}: Props) {
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [...buildablePolygon];
    if (candidate) {
      for (const r of candidate.rooms) pts.push(...r.polygon, r.centroid);
    }
    return pts;
  }, [buildablePolygon, candidate]);

  const view = useMemo(() => {
    const { minX, minY, maxX, maxY } = bounds(allPoints);
    const worldW = Math.max(1e-6, maxX - minX);
    const worldH = Math.max(1e-6, maxY - minY);
    const padX = width * CANVAS_PADDING;
    const padY = height * CANVAS_PADDING;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const scale = Math.min(usableW / worldW, usableH / worldH);
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return {
      minX,
      minY,
      maxX,
      maxY,
      padX,
      padY,
      scale: s,
      toScreen: (p: [number, number]): [number, number] => {
        const [x, y] = p;
        const sx = padX + (x - minX) * s;
        const sy = padY + (maxY - y) * s;
        return [sx, sy];
      },
    };
  }, [allPoints, width, height]);

  const viewWithScale = useMemo(
    () => ({ ...view, scale: view.scale }),
    [view],
  );

  return (
    <Stage width={width} height={height} listening={false}>
      <PlotBoundaryLayer buildablePolygon={buildablePolygon} view={view} />
      <RoomFillLayer candidate={candidate} view={view} />
      {showFurniture && <FurnitureLayer candidate={candidate} view={viewWithScale} />}
      <WallLayer
        candidate={candidate}
        buildablePolygon={buildablePolygon}
        view={view}
      />
      <DoorLayer candidate={candidate} view={viewWithScale} />
      <RoomLabelLayer candidate={candidate} view={view} />
    </Stage>
  );
}
