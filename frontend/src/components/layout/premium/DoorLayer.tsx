"use client";

import React, { useMemo } from "react";
import { Arc, Layer, Line } from "react-konva";
import type { LayoutCandidate } from "@/lib/types";
import { DOOR } from "./constants";

type ViewTransform = {
  toScreen: (p: [number, number]) => [number, number];
  scale: number;
};

type Props = {
  candidate: LayoutCandidate | null;
  view: ViewTransform;
};

/**
 * Door layer: wall gap, door leaf line, quarter swing arc.
 * Uses door.position and door.angle from API (deterministic).
 */
export const DoorLayer = React.memo(function DoorLayer({
  candidate,
  view,
}: Props) {
  const doors = useMemo(() => {
    const list = candidate?.doors ?? [];
    return list.map((d) => {
      const [px, py] = d.position;
      const posScreen = view.toScreen([px, py]);
      const angleRad = Number(d.angle);
      const width = Number(d.width) || 0.9;
      const widthScreen = width * view.scale;

      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const hingeWorld: [number, number] = [
        px - (width / 2) * cosA,
        py - (width / 2) * sinA,
      ];
      const leafEndWorld: [number, number] = [
        px + (width / 2) * cosA,
        py + (width / 2) * sinA,
      ];
      const openEndWorld: [number, number] = [
        px + width * Math.cos(angleRad + Math.PI / 2),
        py + width * Math.sin(angleRad + Math.PI / 2),
      ];

      const hingeScreen = view.toScreen(hingeWorld);
      const leafEndScreen = view.toScreen(leafEndWorld);
      const openEndScreen = view.toScreen(openEndWorld);

      const angleDeg = (angleRad * 180) / Math.PI;
      const arcStart = angleDeg + 90;
      const arcEnd = angleDeg + 180;

      return {
        id: d.id,
        leafLine: [hingeScreen[0], hingeScreen[1], leafEndScreen[0], leafEndScreen[1]],
        openLine: [posScreen[0], posScreen[1], openEndScreen[0], openEndScreen[1]],
        arc: { x: posScreen[0], y: posScreen[1], innerRadius: 0, outerRadius: widthScreen, angle: 90, rotation: arcStart },
      };
    });
  }, [candidate?.doors, view]);

  if (doors.length === 0) return null;

  return (
    <Layer listening={false}>
      {doors.map((d) => (
        <React.Fragment key={d.id}>
          <Line
            points={d.openLine}
            stroke={DOOR.STROKE}
            strokeWidth={DOOR.STROKE_WIDTH}
            lineCap="round"
            listening={false}
          />
          <Line
            points={d.leafLine}
            stroke={DOOR.STROKE}
            strokeWidth={DOOR.STROKE_WIDTH}
            lineCap="round"
            listening={false}
          />
          <Arc
            x={d.arc.x}
            y={d.arc.y}
            innerRadius={d.arc.innerRadius}
            outerRadius={d.arc.outerRadius}
            angle={d.arc.angle}
            rotation={d.arc.rotation}
            stroke={DOOR.ARC_STROKE}
            strokeWidth={1}
            listening={false}
          />
        </React.Fragment>
      ))}
    </Layer>
  );
});
