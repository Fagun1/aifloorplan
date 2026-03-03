"use client";

import React, { useRef, useState } from "react";
import { LayoutCanvasPremium } from "./LayoutCanvasPremium";
import type { LayoutCandidate } from "@/lib/types";

type Props = {
  plotPolygon: [number, number][];
  buildablePolygon: [number, number][];
  candidate: LayoutCandidate | null;
};

/**
 * Premium plan workspace: centered white board, top bar, bottom floating controls.
 * Uses Tailwind: bg-gray-100, white board rounded-2xl shadow-xl, control bar rounded-full shadow-md.
 */
export function PlanWorkspace({
  plotPolygon,
  buildablePolygon,
  candidate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(600);
  const [floorIndex, setFloorIndex] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [showFurniture, setShowFurniture] = useState(true);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setWidth(Math.max(1, cr.width));
      setHeight(Math.max(1, cr.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = zoomPercent / 100;

  return (
    <div className="flex h-full flex-col bg-[#F3F4F6]">
      {/* Top bar: white, shadow-sm, title + Layout label */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <h2 className="text-sm font-medium text-gray-800">
          Floor Plan
        </h2>
        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
          Layout
        </span>
      </header>

      {/* Centered floating workspace: dot grid behind, then white board */}
      <div
        className="flex flex-1 flex-col items-center justify-center overflow-auto p-6"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          className="flex h-[70vh] max-h-[640px] w-[90vw] max-w-[1000px] flex-col rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          style={{ minHeight: 400, opacity: 1 }}
        >
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden rounded-2xl bg-white"
            style={{ minHeight: 0 }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                width,
                height,
              }}
            >
              <LayoutCanvasPremium
                plotPolygon={plotPolygon}
                buildablePolygon={buildablePolygon}
                candidate={candidate}
                width={width}
                height={height}
                showFurniture={showFurniture}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom floating control bar: white, centered, rounded-full, shadow-md */}
      <div className="flex shrink-0 justify-center pb-6">
        <div className="flex items-center gap-4 rounded-full bg-white px-5 py-2.5 shadow-md">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <span className="uppercase">Floor</span>
            <select
              value={floorIndex}
              onChange={(e) => setFloorIndex(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-gray-800"
            >
              <option value={0}>0</option>
            </select>
          </label>
          <span className="h-4 w-px bg-gray-200" />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <span className="uppercase">Zoom</span>
            <input
              type="number"
              min={50}
              max={150}
              step={10}
              value={zoomPercent}
              onChange={(e) =>
                setZoomPercent(Math.min(150, Math.max(50, Number(e.target.value))))
              }
              className="w-14 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center text-gray-800"
            />
            <span>%</span>
          </label>
          <span className="h-4 w-px bg-gray-200" />
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={showFurniture}
              onChange={(e) => setShowFurniture(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-500"
            />
            <span className="uppercase">Furniture</span>
          </label>
        </div>
      </div>
    </div>
  );
}
