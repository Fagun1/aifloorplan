"use client";

import React from "react";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";

export function FurnitureToggle() {
  const { showFurniture, setShowFurniture } = useStudioStore();

  return (
    <label
      className="flex cursor-pointer items-center gap-2 text-xs"
      style={{ color: TOKENS.LABEL_PRIMARY }}
    >
      <input
        type="checkbox"
        checked={showFurniture}
        onChange={(e) => setShowFurniture(e.target.checked)}
        className="h-3 w-3 rounded"
      />
      <span className="uppercase">Furniture</span>
    </label>
  );
}
