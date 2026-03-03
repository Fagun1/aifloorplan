"use client";

import React, { useEffect, useRef, useState } from "react";
import { TopBar } from "./controls/TopBar";
import { LeftRail } from "./controls/LeftRail";
import { BottomBar } from "./controls/BottomBar";
import { DraftMode } from "./modes/DraftMode";
import { PlanMode } from "./modes/PlanMode";
import { AdvancedOverlay } from "./modes/AdvancedOverlay";
import { useStudioStore } from "@/store/studioStore";
import { useLayoutStore } from "@/store/layoutStore";
import { TOKENS } from "@/studio/tokens";

export function StudioLayout() {
  const { mode } = useStudioStore();
  const { response } = useLayoutStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setSize({ width: w, height: h });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        useStudioStore.getState().toggleAdvancedMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const candidate = response?.candidates[0] ?? null;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ background: TOKENS.CANVAS_WHITE, height: "100vh", width: "100vw" }}
    >
      <TopBar />
      <div className="flex flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        <LeftRail candidate={candidate} />
        <div
          ref={containerRef}
          style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative", overflow: "hidden" }}
        >
          {mode === "draft" ? (
            <DraftMode width={size.width} height={size.height} />
          ) : (
            <PlanMode width={size.width} height={size.height} />
          )}
          <AdvancedOverlay />
        </div>
      </div>
      <BottomBar />
    </div>
  );
}
