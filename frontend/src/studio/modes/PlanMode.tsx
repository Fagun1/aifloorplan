"use client";

import React, { useEffect, useRef } from "react";
import { AIInsightsPanel } from "../panels/AIInsightsPanel";
import { useStudioStore } from "@/store/studioStore";
import { useLayoutStore } from "@/store/layoutStore";
import { TOKENS } from "@/studio/tokens";
import type { LayoutCandidate } from "@/lib/types";

type Props = {
  width: number;
  height: number;
};

const PIXELS_PER_METER = 10;
const PAD = 24;

const ROOM_COLORS: Record<string, string> = {
  public: "rgba(74, 144, 226, 0.35)",
  private: "rgba(142, 98, 198, 0.35)",
  service: "rgba(96, 165, 96, 0.35)",
};

function getRoomColor(category: string): string {
  return ROOM_COLORS[category] ?? "rgba(128, 128, 128, 0.35)";
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  toPx: (mx: number, my: number) => [number, number],
  fill: string,
  stroke: string,
  lineWidth = 1
) {
  if (points.length < 2) return;
  ctx.beginPath();
  const [fx, fy] = toPx(points[0][0], points[0][1]);
  ctx.moveTo(fx, fy);
  for (let i = 1; i < points.length; i++) {
    const [px, py] = toPx(points[i][0], points[i][1]);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function PlanMode({ width, height }: Props) {
  const { showAIPanel, setShowAIPanel } = useStudioStore();
  const { request, response, editedCandidate, selectedCandidateId } =
    useLayoutStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasLayout = !!response?.candidates?.length;
  const candidate: LayoutCandidate | null =
    editedCandidate ??
    (response?.candidates?.find(
      (c) => c.candidate_id === selectedCandidateId
    ) ?? response?.candidates?.[0] ?? null) ??
    null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasLayout || !candidate || !response) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const plotPoints = request.plot.points;
    const buildablePolygon = response.buildable_polygon;
    const rooms = candidate.rooms;

    const allPoints: [number, number][] = [
      ...plotPoints,
      ...buildablePolygon,
      ...rooms.flatMap((r) => r.polygon),
    ];
    if (allPoints.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of allPoints) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const contentW = (maxX - minX) * PIXELS_PER_METER;
    const contentH = (maxY - minY) * PIXELS_PER_METER;
    const scale = Math.min(
      (width - 2 * PAD) / contentW,
      (height - 2 * PAD) / contentH
    );
    const tx =
      PAD + (width - 2 * PAD - contentW * scale) / 2 - minX * PIXELS_PER_METER * scale;
    const ty =
      PAD + (height - 2 * PAD - contentH * scale) / 2 - minY * PIXELS_PER_METER * scale;

    const toPx = (mx: number, my: number): [number, number] => [
      mx * PIXELS_PER_METER * scale + tx,
      my * PIXELS_PER_METER * scale + ty,
    ];

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = TOKENS.CANVAS_WHITE;
    ctx.fillRect(0, 0, width, height);

    // Plot boundary
    drawPolygon(
      ctx,
      plotPoints,
      toPx,
      "rgba(42, 95, 230, 0.06)",
      TOKENS.ACCENT,
      2
    );

    // Buildable area
    drawPolygon(
      ctx,
      buildablePolygon,
      toPx,
      "rgba(200, 200, 200, 0.2)",
      "#B0B0B0",
      1
    );

    // Rooms
    for (const room of rooms) {
      const fill = getRoomColor(room.category);
      drawPolygon(
        ctx,
        room.polygon,
        toPx,
        fill,
        TOKENS.WALL_INTERIOR,
        1.5
      );
    }

    // Room labels
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const room of rooms) {
      const [cx, cy] = room.centroid;
      const [px, py] = toPx(cx, cy);
      ctx.fillStyle = TOKENS.LABEL_PRIMARY;
      ctx.fillText(room.name, px, py);
    }
  }, [width, height, hasLayout, candidate, response, request.plot.points]);

  return (
    <div className="relative flex h-full w-full">
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ background: TOKENS.CANVAS_WHITE }}
      >
        {hasLayout ? (
          <canvas
            ref={canvasRef}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              display: "block",
            }}
          />
        ) : (
          <p style={{ color: TOKENS.LABEL_SECONDARY, fontSize: 14 }}>
            No layout generated yet. Draw a plot in Draft mode first.
          </p>
        )}
        {!showAIPanel && (
          <button
            type="button"
            onClick={() => setShowAIPanel(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 -rotate-90 origin-right rounded-t px-2 py-1 text-xs font-medium"
            style={{
              background: TOKENS.PAPER_WHITE,
              color: TOKENS.LABEL_SECONDARY,
              boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
            }}
          >
            AI Insights
          </button>
        )}
      </div>
      {showAIPanel && <AIInsightsPanel />}
    </div>
  );
}
