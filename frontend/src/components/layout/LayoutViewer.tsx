"use client";

import React, { useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import type { LayoutCandidate } from "@/lib/types";
import type { RoomViolations } from "@/lib/constraints";

type Props = {
  plotPolygon: [number, number][];
  buildablePolygon: [number, number][];
  candidate: LayoutCandidate | null;
  roomViolations?: RoomViolations;
  onRoomPolygonChange?: (roomName: string, polygon: [number, number][]) => void;
  highlightedRoom?: string | null;
  gateDirection: string;
};

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 900, height: 600 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: Math.max(1, cr.width), height: Math.max(1, cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function flat(points: [number, number][]) {
  const out: number[] = [];
  for (const [x, y] of points) out.push(x, y);
  return out;
}

function bounds(points: [number, number][]) {
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

function roomFillColor(name: string, category: string) {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();
  if (n.includes("living") || c === "public") return "#1e293b";
  if (n.includes("bed") || n.includes("bedroom") || c === "private") return "#1f2937";
  if (n.includes("kitchen") || c === "service") return "#064e3b";
  if (n.includes("bath") || n.includes("wc") || n.includes("toilet")) return "#3f3f46";
  return "#334155";
}

export function LayoutViewer({
  plotPolygon,
  buildablePolygon,
  candidate,
  roomViolations,
  onRoomPolygonChange,
  highlightedRoom,
  gateDirection,
}: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const dragStart = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    x: number;
    y: number;
    reasons: string[];
  } | null>(null);
  const [hoveredRoomName, setHoveredRoomName] = useState<string | null>(null);

  const allWorldPoints = useMemo(() => {
    const pts: [number, number][] = [];
    pts.push(...plotPolygon);
    pts.push(...buildablePolygon);
    if (candidate) {
      for (const r of candidate.rooms) pts.push(...r.polygon);
      for (const path of candidate.circulation_paths) pts.push(...path);
      for (const r of candidate.rooms) pts.push(r.centroid);
    }
    return pts;
  }, [plotPolygon, buildablePolygon, candidate]);

  const view = useMemo(() => {
    const { minX, minY, maxX, maxY } = bounds(allWorldPoints);
    const worldW = Math.max(1e-6, maxX - minX);
    const worldH = Math.max(1e-6, maxY - minY);
    const pad = 24;
    const scale = Math.min(
      (size.width - pad * 2) / worldW,
      (size.height - pad * 2) / worldH,
    );
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return { minX, minY, maxX, maxY, pad, scale: s };
  }, [allWorldPoints, size.width, size.height]);

  const toScreen = (p: [number, number]): [number, number] => {
    const [x, y] = p;
    // Flip Y so world +Y is "up" on canvas
    const sx = view.pad + (x - view.minX) * view.scale;
    const sy = view.pad + (view.maxY - y) * view.scale;
    return [sx, sy];
  };

  const plotLine = useMemo(() => flat(plotPolygon.map(toScreen)), [plotPolygon, view]);
  const buildableLine = useMemo(
    () => flat(buildablePolygon.map(toScreen)),
    [buildablePolygon, view],
  );

  const roomShapes = useMemo(() => {
    if (!candidate) return [];
    return candidate.rooms.map((r) => {
      const pts = r.polygon.map(toScreen);
      return {
        ...r,
        screenPts: pts,
        flatPts: flat(pts),
        screenCentroid: toScreen(r.centroid),
      };
    });
  }, [candidate, view]);

  const centroidByName = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const r of roomShapes) m.set(r.name, r.screenCentroid);
    return m;
  }, [roomShapes]);

  const circulationLines = useMemo(() => {
    if (!candidate) return [];
    return candidate.circulation_paths
      .map((path) => path.map(toScreen))
      .map((pts) => flat(pts));
  }, [candidate, view]);

  const gridLines = useMemo(() => {
    const lines: number[][] = [];
    const { minX, minY, maxX, maxY } = view;
    const maxLines = 200;

    const xStart = Math.floor(minX);
    const xEnd = Math.ceil(maxX);
    const yStart = Math.floor(minY);
    const yEnd = Math.ceil(maxY);

    let count = 0;
    for (let x = xStart; x <= xEnd && count < maxLines; x += 1) {
      const p1 = toScreen([x, minY]);
      const p2 = toScreen([x, maxY]);
      lines.push([...p1, ...p2]);
      count += 1;
    }
    for (let y = yStart; y <= yEnd && count < maxLines; y += 1) {
      const p1 = toScreen([minX, y]);
      const p2 = toScreen([maxX, y]);
      lines.push([...p1, ...p2]);
      count += 1;
    }
    return lines;
  }, [view, toScreen]);

  const zoningRects = useMemo(() => {
    const gd = gateDirection.toLowerCase();
    const { minX, minY, maxX, maxY, scale, pad } = view;
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    if (worldW <= 0 || worldH <= 0 || scale <= 0) return null;

    if (gd === "south" || gd === "north") {
      const depth = worldH;
      const frontDepth = 0.25 * depth;
      const rearDepth = 0.3 * depth;

      const frontY1 = gd === "south" ? minY : maxY - frontDepth;
      const frontY2 = gd === "south" ? minY + frontDepth : maxY;

      const rearY2 = gd === "south" ? maxY : minY + rearDepth;
      const rearY1 = gd === "south" ? maxY - rearDepth : minY;

      const x = pad;
      const width = worldW * scale;

      const frontTop = pad + (maxY - frontY2) * scale;
      const frontBottom = pad + (maxY - frontY1) * scale;
      const rearTop = pad + (maxY - rearY2) * scale;
      const rearBottom = pad + (maxY - rearY1) * scale;

      return {
        front: { x, y: frontTop, width, height: frontBottom - frontTop },
        rear: { x, y: rearTop, width, height: rearBottom - rearTop },
      };
    }

    // east / west: stripe along X
    const width = worldW;
    const depth = worldW;
    const frontDepth = 0.25 * depth;
    const rearDepth = 0.3 * depth;

    const frontX1 = gd === "west" ? minX : maxX - frontDepth;
    const frontX2 = gd === "west" ? minX + frontDepth : maxX;

    const rearX2 = gd === "west" ? maxX : minX + rearDepth;
    const rearX1 = gd === "west" ? maxX - rearDepth : minX;

    const y = pad;
    const height = worldH * scale;

    const frontLeft = pad + (frontX1 - minX) * scale;
    const frontRight = pad + (frontX2 - minX) * scale;
    const rearLeft = pad + (rearX1 - minX) * scale;
    const rearRight = pad + (rearX2 - minX) * scale;

    return {
      front: { x: frontLeft, y, width: frontRight - frontLeft, height },
      rear: { x: rearLeft, y, width: rearRight - rearLeft, height },
    };
  }, [view, gateDirection]);

  const adjacencySegments = useMemo(() => {
    if (!candidate || !hoveredRoomName) return [];
    const segs: number[][] = [];
    const neighbors = candidate.adjacency_matrix[hoveredRoomName] ?? [];
    const roomByName = new Map(candidate.rooms.map((r) => [r.name, r]));

    const getSegments = (pts: [number, number][]) => {
      const segments: [number, number][][] = [];
      for (let i = 0; i < pts.length; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        segments.push([a, b]);
      }
      return segments;
    };

    const equalSeg = (a: [number, number][], b: [number, number][]) => {
      const [[ax1, ay1], [ax2, ay2]] = a;
      const [[bx1, by1], [bx2, by2]] = b;
      const eps = 1e-6;
      const same =
        Math.hypot(ax1 - bx1, ay1 - by1) < eps &&
        Math.hypot(ax2 - bx2, ay2 - by2) < eps;
      const sameRev =
        Math.hypot(ax1 - bx2, ay1 - by2) < eps &&
        Math.hypot(ax2 - bx1, ay2 - by1) < eps;
      return same || sameRev;
    };

    const baseRoom = roomByName.get(hoveredRoomName);
    if (!baseRoom) return segs;
    const baseSegs = getSegments(baseRoom.polygon);

    for (const n of neighbors) {
      const neigh = roomByName.get(n);
      if (!neigh) continue;
      const neighSegs = getSegments(neigh.polygon);
      for (const s1 of baseSegs) {
        for (const s2 of neighSegs) {
          if (equalSeg(s1, s2)) {
            const [p1, p2] = s1;
            const [sx1, sy1] = toScreen(p1);
            const [sx2, sy2] = toScreen(p2);
            segs.push([sx1, sy1, sx2, sy2]);
          }
        }
      }
    }
    return segs;
  }, [candidate, hoveredRoomName, toScreen]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%", position: "relative", background: "#0b1020" }}
    >
      <Stage width={size.width} height={size.height}>
        <Layer listening={false}>
          {/* Grid */}
          {gridLines.map((pts, i) => (
            <Line
              key={`grid-${i}`}
              points={pts}
              stroke="#1e293b"
              strokeWidth={1}
              opacity={0.15}
            />
          ))}

          {/* Zoning overlay */}
          {zoningRects && (
            <>
              <Rect
                x={zoningRects.front.x}
                y={zoningRects.front.y}
                width={zoningRects.front.width}
                height={zoningRects.front.height}
                fill="#0ea5e9"
                opacity={0.05}
              />
              <Rect
                x={zoningRects.rear.x}
                y={zoningRects.rear.y}
                width={zoningRects.rear.width}
                height={zoningRects.rear.height}
                fill="#22c55e"
                opacity={0.05}
              />
            </>
          )}

          {/* Plot polygon */}
          <Line
            points={plotLine}
            closed
            stroke="#64748b"
            strokeWidth={1.5}
            lineJoin="round"
          />

          {/* Buildable polygon */}
          <Line
            points={buildableLine}
            closed
            stroke="#22c55e"
            strokeWidth={2}
            dash={[6, 6]}
            lineJoin="round"
          />

          {/* Circulation paths */}
          {circulationLines.map((pts, i) => (
            <Line
              key={`circ-${i}`}
              points={pts}
              stroke="rgba(56, 189, 248, 0.9)"
              strokeWidth={2}
              lineCap="round"
            />
          ))}
        </Layer>

        <Layer>
          {/* Rooms */}
          {roomShapes.map((r) => {
            const fill = roomFillColor(r.name, r.category);
            const reasons = roomViolations?.[r.name] ?? [];
            const hasViolation = reasons.length > 0;
            const isHighlighted = highlightedRoom === r.name;

            let strokeColor = hasViolation ? "#ef4444" : "#64748b";
            let strokeWidth = hasViolation ? 2.5 : 1.5;
            let shadowColor = "#000000";
            let shadowBlur = 8;
            let shadowOpacity = 0.25;
            let shadowOffsetX = 2;
            let shadowOffsetY = 2;

            if (isHighlighted) {
              strokeColor = "#facc15";
              strokeWidth = 4;
              shadowColor = "#facc15";
              shadowBlur = 15;
              shadowOpacity = 0.9;
              shadowOffsetX = 0;
              shadowOffsetY = 0;
            }

            const xs = r.screenPts.map(([x]) => x);
            const ys = r.screenPts.map(([, y]) => y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const labelX = (minX + maxX) / 2;
            const labelY = (minY + maxY) / 2;
            const labelWidth = Math.max(maxX - minX, 60);

            const areaText = `${r.area_m2.toFixed(1)} m²`;
            const label = `${r.name}\n${areaText}`;

            return (
              <Group
                key={r.name}
                draggable
                onDragStart={(e) => {
                  dragStart.current.set(r.name, { x: e.target.x(), y: e.target.y() });
                }}
                onDragEnd={(e) => {
                  const start = dragStart.current.get(r.name) ?? {
                    x: 0,
                    y: 0,
                  };
                  const pos = e.target.position();
                  const dxScreen = pos.x - start.x;
                  const dyScreen = pos.y - start.y;
                  e.target.position({ x: 0, y: 0 });
                  dragStart.current.delete(r.name);
                  if (!candidate) return;
                  if (dxScreen === 0 && dyScreen === 0) return;
                  const dxWorld = dxScreen / view.scale;
                  const dyWorld = -dyScreen / view.scale;
                  const newPoly = r.polygon.map(
                    ([x, y]) => [x + dxWorld, y + dyWorld] as [number, number],
                  );
                  if (onRoomPolygonChange) {
                    onRoomPolygonChange(r.name, newPoly);
                  }
                }}
                onMouseEnter={() => {
                  setHoveredRoomName(r.name);
                  if (!hasViolation) {
                    setHoverInfo(null);
                    return;
                  }
                  setHoverInfo({
                    name: r.name,
                    x: r.screenCentroid[0],
                    y: r.screenCentroid[1],
                    reasons,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredRoomName((prev) => (prev === r.name ? null : prev));
                  setHoverInfo(null);
                }}
              >
                <Line
                  points={r.flatPts}
                  closed
                  fill={fill}
                  opacity={0.85}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  lineJoin="round"
                  shadowColor={shadowColor}
                  shadowBlur={shadowBlur}
                  shadowOpacity={shadowOpacity}
                  shadowOffsetX={shadowOffsetX}
                  shadowOffsetY={shadowOffsetY}
                />
                <Text
                  x={labelX}
                  y={labelY}
                  text={label}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#ffffff"
                  align="center"
                  width={labelWidth}
                  offsetX={labelWidth / 2}
                  padding={2}
                  listening={false}
                />
              </Group>
            );
          })}

          {/* Adjacency highlight for hovered room */}
          {adjacencySegments.map((pts, i) => (
            <Line
              key={`adjseg-${i}`}
              points={pts}
              stroke="#38bdf8"
              strokeWidth={3}
              opacity={0.4}
              lineCap="round"
            />
          ))}

          {/* Scale bar */}
          {view.scale > 0 && (
            <>
              <Line
                points={[
                  size.width - 24 - view.scale,
                  size.height - 24,
                  size.width - 24,
                  size.height - 24,
                ]}
                stroke="#94a3b8"
                strokeWidth={2}
                opacity={0.7}
              />
              <Text
                x={size.width - 24 - view.scale / 2}
                y={size.height - 36}
                text="1m"
                fontSize={11}
                fill="#94a3b8"
                align="center"
                width={view.scale}
                offsetX={view.scale / 2}
                listening={false}
              />
            </>
          )}
        </Layer>
      </Stage>

      {hoverInfo ? (
        <div
          style={{
            position: "absolute",
            left: hoverInfo.x + 12,
            top: hoverInfo.y + 12,
            maxWidth: 220,
            padding: "6px 8px",
            borderRadius: 8,
            fontSize: 11,
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid rgba(248, 113, 113, 0.65)",
            color: "#fecaca",
            pointerEvents: "none",
            whiteSpace: "pre-wrap",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoverInfo.name}</div>
          <div>{hoverInfo.reasons.join("\n")}</div>
        </div>
      ) : null}
    </div>
  );
}

