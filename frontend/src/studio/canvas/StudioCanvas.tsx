"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Stage } from "react-konva";
import { GridLayer } from "./layers/GridLayer";
import { PlotLayer } from "./layers/PlotLayer";
import { ExteriorWallLayer } from "./layers/ExteriorWallLayer";
import { InteriorWallLayer } from "./layers/InteriorWallLayer";
import { DoorLayer } from "./layers/DoorLayer";
import { FurnitureLayer } from "./layers/FurnitureLayer";
import { LabelLayer } from "./layers/LabelLayer";
import { TOKENS } from "@/studio/tokens";
import { useStudioStore } from "@/store/studioStore";
import type { LayoutCandidate } from "@/lib/types";

const PADDING = 0.12;

function bounds(points: [number, number][]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
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
  width: number;
  height: number;
  mode: "draft" | "plan";
  draftPolygon: [number, number][];
  draftClosed: boolean;
  candidate: LayoutCandidate | null;
  buildablePolygon: [number, number][];
  showFurniture: boolean;
  onDraftClick?: (world: [number, number]) => void;
};

export function StudioCanvas({
  width,
  height,
  mode,
  draftPolygon,
  draftClosed,
  candidate,
  buildablePolygon,
  showFurniture,
  onDraftClick,
}: Props) {
  const { zoom, pan } = useStudioStore();
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const view = useMemo(() => {
    const b =
      mode === "draft"
        ? { minX: 0, minY: 0, maxX: 20, maxY: 10 }
        : bounds([
            ...buildablePolygon,
            ...(candidate
              ? candidate.rooms.flatMap((r) => [...r.polygon, r.centroid])
              : []),
            ...draftPolygon,
          ]);
    const { minX, minY, maxX, maxY } = b;
    const worldW = Math.max(1e-6, maxX - minX);
    const worldH = Math.max(1e-6, maxY - minY);
    const padX = width * PADDING;
    const padY = height * PADDING;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const scale = Math.min(usableW / worldW, usableH / worldH) * zoom;
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const ox = padX + pan.x;
    const oy = padY + pan.y;
    return {
      minX,
      minY,
      maxX,
      maxY,
      scale: s,
      toScreen: (p: [number, number]): [number, number] => {
        const [x, y] = p;
        const sx = ox + (x - minX) * s;
        const sy = oy + (maxY - y) * s;
        return [sx, sy];
      },
      toWorld: (screen: [number, number]): [number, number] => {
        const [sx, sy] = screen;
        const x = minX + (sx - ox) / s;
        const y = maxY - (sy - oy) / s;
        return [x, y];
      },
    };
  }, [mode, buildablePolygon, candidate, draftPolygon, width, height, zoom, pan]);

  const viewWithScale = useMemo(
    () => ({ ...view, scale: view.scale }),
    [view]
  );

  const gridBounds = useMemo(
    () => ({
      minX: view.minX - 5,
      maxX: view.maxX + 5,
      minY: view.minY - 5,
      maxY: view.maxY + 5,
    }),
    [view]
  );

  const getLocalPos = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): [number, number] => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return [0, 0];
      return [e.clientX - rect.left, e.clientY - rect.top];
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode === "draft" && onDraftClick) {
        if (e.button === 2) {
          useStudioStore.getState().removeLastDraftVertex();
          return;
        }
        if (e.button === 0) {
          const pos = getLocalPos(e);
          const world = view.toWorld(pos);
          onDraftClick(world);
        }
        return;
      }
      if (mode !== "draft" && e.button === 0) {
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [mode, onDraftClick, view, getLocalPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        useStudioStore.getState().setPan({ x: pan.x + dx, y: pan.y + dy });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [dragStart, pan]
  );

  const handleMouseUp = useCallback(() => {
    setDragStart(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      useStudioStore.getState().setZoom(zoom + delta);
    },
    [zoom]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        cursor: mode === "draft" ? "crosshair" : "grab",
        touchAction: "none",
        position: "relative",
        background: TOKENS.CANVAS_WHITE,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage width={width} height={height}>
        <GridLayer view={viewWithScale} bounds={gridBounds} visible />

        {mode === "draft" ? (
          <PlotLayer
            polygon={draftPolygon}
            view={view}
            closed={draftClosed}
          />
        ) : (
          <>
            <ExteriorWallLayer
              candidate={candidate}
              buildablePolygon={buildablePolygon}
              view={view}
            />
            <InteriorWallLayer
              candidate={candidate}
              buildablePolygon={buildablePolygon}
              view={view}
            />
            <DoorLayer candidate={candidate} view={viewWithScale} />
            {showFurniture && (
              <FurnitureLayer candidate={candidate} view={viewWithScale} />
            )}
            <LabelLayer candidate={candidate} view={view} />
          </>
        )}
      </Stage>
    </div>
  );
}
