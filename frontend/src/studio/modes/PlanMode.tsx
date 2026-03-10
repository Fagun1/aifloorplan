"use client";
/**
 * PlanMode — updated with Phase 2: ToolPalette, FloorNavigator, PropertyPanel,
 * ConstraintOverlay, room selection, grid snap, and WebSocket live sync.
 */
import React, { useEffect, useRef, useCallback, useState } from "react";
import { AIInsightsPanel } from "../panels/AIInsightsPanel";
import { useStudioStore } from "@/store/studioStore";
import { useLayoutStore } from "@/store/layoutStore";
import { useEditorStore } from "@/store/editorStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ToolPalette } from "@/components/editor/ToolPalette";
import { FloorNavigator } from "@/components/editor/FloorNavigator";
import { PropertyPanel } from "@/components/editor/PropertyPanel";
import { TOKENS } from "@/studio/tokens";
import type { LayoutCandidate, RoomPlacement } from "@/lib/types";

type Props = { width: number; height: number };

const PIXELS_PER_METER = 10;
const PAD = 24;

const ROOM_COLORS: Record<string, { fill: string; stroke: string }> = {
  public: { fill: "rgba(108,99,255,0.30)", stroke: "#6c63ff" },
  private: { fill: "rgba(72,201,176,0.30)", stroke: "#48c9b0" },
  service: { fill: "rgba(245,200,66,0.30)", stroke: "#f5c842" },
};

function snapToGrid(val: number, gridSize = 0.5) {
  return Math.round(val / gridSize) * gridSize;
}

export function PlanMode({ width, height }: Props) {
  const { showAIPanel, setShowAIPanel, floorIndex, zoom, pan, setZoom, setPan } = useStudioStore();
  const { request, response, editedCandidate, selectedCandidateId } = useLayoutStore();
  const { activeTool, selectedRoomName, selectRoom, violations, snapToGrid: doSnap, gridSizeM } = useEditorStore();

  // Derive project ID from URL for WebSocket
  const [projectId, setProjectId] = useState<string | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const pId = url.searchParams.get("project");
    setProjectId(pId);
  }, []);

  const { sendRoomMove } = useWebSocket(projectId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ roomName: string; startMx: number; startMy: number } | null>(null);
  const panStart = useRef<{ x: number; y: number } | null>(null);

  const candidate: LayoutCandidate | null =
    editedCandidate ??
    (response?.candidates?.find(c => c.candidate_id === selectedCandidateId) ??
      response?.candidates?.[0] ?? null) ?? null;

  const hasLayout = !!response?.candidates?.length;

  // ── Build transform helpers ─────────────────────────────
  const buildTransform = useCallback(() => {
    if (!candidate || !response) return null;
    const plotPoints = (request.plot as any).vertices ?? (request.plot as any).points ?? [];
    const buildablePolygon = response.buildable_polygon;
    const rooms = candidate.rooms;

    const allPoints: [number, number][] = [
      ...plotPoints, ...buildablePolygon,
      ...rooms.flatMap(r => r.polygon),
    ];
    if (!allPoints.length) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of allPoints) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const contentW = (maxX - minX) * PIXELS_PER_METER;
    const contentH = (maxY - minY) * PIXELS_PER_METER;
    const baseScale = Math.min((width - 2 * PAD) / contentW, (height - 2 * PAD) / contentH);
    const scale = baseScale * zoom;
    const tx = PAD + (width - 2 * PAD - contentW * scale) / 2 - minX * PIXELS_PER_METER * scale + pan.x;
    const ty = PAD + (height - 2 * PAD - contentH * scale) / 2 - minY * PIXELS_PER_METER * scale + pan.y;

    const toPx = (mx: number, my: number): [number, number] => [mx * PIXELS_PER_METER * scale + tx, my * PIXELS_PER_METER * scale + ty];
    const toWorld = (px: number, py: number): [number, number] => [(px - tx) / (PIXELS_PER_METER * scale), (py - ty) / (PIXELS_PER_METER * scale)];

    return { toPx, toWorld, scale };
  }, [candidate, response, request, width, height, zoom, pan]);

  // ── Draw canvas ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasLayout || !candidate || !response) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const transform = buildTransform();
    if (!transform) return;
    const { toPx } = transform;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = TOKENS.CANVAS_WHITE;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    const gridPx = PIXELS_PER_METER * zoom;
    for (let gx = 0; gx < width; gx += gridPx) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += gridPx) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
    }

    // Plot boundary
    const plotPts = (request.plot as any).vertices ?? (request.plot as any).points ?? [];
    if (plotPts.length >= 2) {
      ctx.beginPath();
      const [fx, fy] = toPx(plotPts[0][0], plotPts[0][1]);
      ctx.moveTo(fx, fy);
      for (let i = 1; i < plotPts.length; i++) { const [px, py] = toPx(plotPts[i][0], plotPts[i][1]); ctx.lineTo(px, py); }
      ctx.closePath();
      ctx.fillStyle = "rgba(74,144,226,0.06)";
      ctx.fill();
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Filter rooms for current floor
    const floorRooms = candidate.rooms.filter(r => (r as any).floor_number === floorIndex || (r as any).floor_number == null);

    // Violation set
    const violatingNames = new Set(violations.map(v => v.room_name));

    // Rooms
    for (const room of floorRooms) {
      const colorDef = ROOM_COLORS[room.category] ?? { fill: "rgba(128,128,128,0.3)", stroke: "#888" };
      const isSelected = room.name === selectedRoomName;
      const isViolating = violatingNames.has(room.name);

      ctx.beginPath();
      const poly = room.polygon;
      const [fx2, fy2] = toPx(poly[0][0], poly[0][1]);
      ctx.moveTo(fx2, fy2);
      for (let i = 1; i < poly.length; i++) { const [ppx, ppy] = toPx(poly[i][0], poly[i][1]); ctx.lineTo(ppx, ppy); }
      ctx.closePath();

      if (isViolating) {
        ctx.fillStyle = "rgba(255,101,132,0.22)";
        ctx.strokeStyle = "#ff6584";
        ctx.setLineDash([6, 3]);
        ctx.lineWidth = 2;
      } else if (isSelected) {
        ctx.fillStyle = colorDef.fill.replace("0.30", "0.55");
        ctx.strokeStyle = colorDef.stroke;
        ctx.setLineDash([]);
        ctx.lineWidth = 2.5;
      } else {
        ctx.fillStyle = colorDef.fill;
        ctx.strokeStyle = colorDef.stroke;
        ctx.setLineDash([]);
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Room label
      const [cx, cy] = toPx(room.centroid[0], room.centroid[1]);
      ctx.fillStyle = TOKENS.LABEL_PRIMARY;
      ctx.font = `${isSelected ? "bold " : ""}11px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(room.name, cx, cy);
      ctx.font = "9px system-ui, sans-serif";
      ctx.fillStyle = TOKENS.LABEL_SECONDARY;
      ctx.fillText(`${room.area_m2.toFixed(1)}m²`, cx, cy + 13);
    }

    // Violation warning labels
    for (const room of floorRooms) {
      if (!violatingNames.has(room.name)) continue;
      const [cx, cy] = toPx(room.centroid[0], room.centroid[1]);
      ctx.fillStyle = "#ff6584";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("⚠", cx, cy - 14);
    }
  }, [width, height, hasLayout, candidate, response, request, zoom, pan, floorIndex, selectedRoomName, violations, buildTransform]);

  // ── Mouse events — selection, move, pan ─────────────────
  function screenToRoom(px: number, py: number): RoomPlacement | null {
    const transform = buildTransform();
    if (!transform || !candidate) return null;
    const [mx, my] = transform.toWorld(px, py);
    return candidate.rooms.find(room => {
      const poly = room.polygon;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
        if ((yi > my) !== (yj > my) && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }) ?? null;
  }

  function getCanvasPos(e: React.MouseEvent): [number, number] {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function handleMouseDown(e: React.MouseEvent) {
    const [px, py] = getCanvasPos(e);
    const room = screenToRoom(px, py);

    if (activeTool === "select" || activeTool === "move") {
      if (room) {
        selectRoom(room.name);
        if (activeTool === "move") {
          const transform = buildTransform();
          if (transform) {
            const [mx, my] = transform.toWorld(px, py);
            dragging.current = { roomName: room.name, startMx: mx, startMy: my };
          }
        }
      } else if (activeTool === "select") {
        selectRoom(null);
        panStart.current = { x: e.clientX, y: e.clientY };
      }
    } else if (activeTool === "delete" && room) {
      const { setEditedCandidate } = useLayoutStore.getState();
      const current = candidate;
      if (current) {
        setEditedCandidate({ ...current, rooms: current.rooms.filter(r => r.name !== room.name) });
        selectRoom(null);
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    // Pan
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      panStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Move room
    if (dragging.current && candidate) {
      const transform = buildTransform();
      if (!transform) return;
      const [px, py] = getCanvasPos(e);
      const [mx, my] = transform.toWorld(px, py);
      const dx = mx - dragging.current.startMx;
      const dy = my - dragging.current.startMy;
      const { setEditedCandidate } = useLayoutStore.getState();
      const updated = {
        ...candidate,
        rooms: candidate.rooms.map(room => {
          if (room.name !== dragging.current!.roomName) return room;
          const snappedDx = doSnap ? snapToGrid(dx, gridSizeM) : dx;
          const snappedDy = doSnap ? snapToGrid(dy, gridSizeM) : dy;
          const newPoly = room.polygon.map(([rx, ry]) => [rx + snappedDx, ry + snappedDy] as [number, number]);
          const newCentroid: [number, number] = [room.centroid[0] + snappedDx, room.centroid[1] + snappedDy];
          sendRoomMove(room.name, newPoly, newCentroid);
          return { ...room, polygon: newPoly, centroid: newCentroid };
        }),
      };
      setEditedCandidate(updated as LayoutCandidate);
    }
  }

  function handleMouseUp() {
    dragging.current = null;
    panStart.current = null;
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(zoom + (e.deltaY > 0 ? -0.08 : 0.08));
  }

  // Determine cursor
  const cursorMap: Record<string, string> = { select: "pointer", move: "move", add: "crosshair", delete: "not-allowed" };
  const cursor = cursorMap[activeTool] ?? "default";

  // Per-floor room counts
  const floorRoomCounts = candidate
    ? Array.from({ length: (request as any).num_floors ?? 1 }, (_, fi) =>
      candidate.rooms.filter(r => (r as any).floor_number === fi || (r as any).floor_number == null).length
    )
    : undefined;

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Tool Palette */}
      <ToolPalette />

      <div className="relative flex flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex flex-1 items-center justify-center overflow-hidden"
          style={{ background: TOKENS.CANVAS_WHITE, cursor, userSelect: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
        >
          {hasLayout ? (
            <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px`, display: "block" }} />
          ) : (
            <div style={{ textAlign: "center", color: TOKENS.LABEL_SECONDARY }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🏗️</p>
              <p style={{ fontSize: 14 }}>No layout generated yet.<br />Go to your project and generate layouts first.</p>
            </div>
          )}

          {/* Floor Navigator */}
          {candidate && (
            <FloorNavigator
              totalFloors={(request as any).num_floors ?? 1}
              floorRoomCounts={floorRoomCounts}
            />
          )}
        </div>

        {/* Right side panels */}
        {showAIPanel && <AIInsightsPanel />}
        <PropertyPanel />
      </div>
    </div>
  );
}
