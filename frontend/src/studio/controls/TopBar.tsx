"use client";

import React from "react";
import { useStudioStore } from "@/store/studioStore";
import { useLayoutStore } from "@/store/layoutStore";
import { TOKENS } from "@/studio/tokens";

export function TopBar() {
  const { mode, isAdvancedMode, setMode, setShowParameterPanel, setDraftPolygon } =
    useStudioStore();
  const { request } = useLayoutStore();

  const handleEditPlot = () => {
    setDraftPolygon((request.plot as any).vertices ?? (request.plot as any).points ?? []);
    setMode("draft");
    setShowParameterPanel(false);
  };

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-6"
      style={{
        background: TOKENS.PAPER_WHITE,
        borderColor: "rgba(0,0,0,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <h1
        className="text-sm font-medium"
        style={{ color: TOKENS.LABEL_PRIMARY }}
      >
        {mode === "draft" ? "Draft" : "Plan"}
      </h1>
      <div className="flex items-center gap-4">
        {mode === "plan" && (
          <button
            type="button"
            onClick={handleEditPlot}
            className="text-xs font-medium uppercase"
            style={{ color: TOKENS.ACCENT }}
          >
            Edit Plot
          </button>
        )}
        {isAdvancedMode && (
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ background: "#F5F3EE", color: TOKENS.LABEL_SECONDARY }}
          >
            ADVANCED
          </span>
        )}
      </div>
    </header>
  );
}
