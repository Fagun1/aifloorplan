"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ParameterPanel } from "../panels/ParameterPanel";
import { useStudioStore } from "@/store/studioStore";

type Props = {
  width: number;
  height: number;
};

const GRID_SIZE = 10;
const SNAP_RADIUS = 12;
const POINT_RADIUS = 5;
const ACCENT = "#2A5FE6";
const GRID_COLOR = "#E0E0DC";
const GRID_MAJOR_COLOR = "#C8C8C4";

export function DraftMode({ width, height }: Props) {
  const { draftPolygon, addDraftVertex, setShowParameterPanel } = useStudioStore();
  const [closed, setClosed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (closed) return;
      if (e.button !== 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPt: [number, number] = [x, y];

      if (draftPolygon.length >= 3) {
        const first = draftPolygon[0];
        const d = Math.hypot(x - first[0], y - first[1]);
        if (d < SNAP_RADIUS) {
          setClosed(true);
          setShowParameterPanel(true);
          return;
        }
      }

      addDraftVertex(worldPt);
    },
    [closed, draftPolygon, addDraftVertex, setShowParameterPanel]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (draftPolygon.length > 0) {
        useStudioStore.getState().removeLastDraftVertex();
      }
    },
    [draftPolygon.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && draftPolygon.length > 0) {
        useStudioStore.getState().removeLastDraftVertex();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draftPolygon.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, width, height);

    // Grid
    for (let x = 0; x <= width; x += GRID_SIZE) {
      const isMajor = Math.round(x / GRID_SIZE) % 5 === 0;
      ctx.strokeStyle = isMajor ? GRID_MAJOR_COLOR : GRID_COLOR;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += GRID_SIZE) {
      const isMajor = Math.round(y / GRID_SIZE) % 5 === 0;
      ctx.strokeStyle = isMajor ? GRID_MAJOR_COLOR : GRID_COLOR;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Polygon lines
    if (draftPolygon.length >= 2) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.setLineDash(closed ? [] : [6, 4]);
      ctx.beginPath();
      ctx.moveTo(draftPolygon[0][0], draftPolygon[0][1]);
      for (let i = 1; i < draftPolygon.length; i++) {
        ctx.lineTo(draftPolygon[i][0], draftPolygon[i][1]);
      }
      if (closed) {
        ctx.closePath();
        ctx.fillStyle = "rgba(42, 95, 230, 0.05)";
        ctx.fill();
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vertices
    for (let i = 0; i < draftPolygon.length; i++) {
      const [px, py] = draftPolygon[i];
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(px, py, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      if (i === 0 && draftPolygon.length >= 3 && !closed) {
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, SNAP_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [width, height, draftPolygon, closed]);

  const showParameterPanel = useStudioStore((s) => s.showParameterPanel);
  const clearDraft = useStudioStore((s) => s.clearDraft);

  const panelVisible = showParameterPanel && closed;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          cursor: closed ? "default" : "crosshair",
          display: "block",
        }}
        onClick={handleCanvasClick}
        onContextMenu={handleRightClick}
      />
      {draftPolygon.length > 0 && !panelVisible && (
        <button
          type="button"
          onClick={() => {
            clearDraft();
            setClosed(false);
          }}
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            zIndex: 10,
            background: "white",
            border: "1px solid rgba(0,0,0,0.1)",
            color: "#333",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      )}
      {panelVisible && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 20,
          }}
        >
          <ParameterPanel />
        </div>
      )}
    </div>
  );
}
