"use client";

import React from "react";
import { FurnitureToggle } from "./FurnitureToggle";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";

export function BottomBar() {
  const { mode, zoom } = useStudioStore();

  return (
    <footer
      className="flex h-8 shrink-0 items-center justify-between px-6"
      style={{
        background: TOKENS.PAPER_WHITE,
        borderTop: "1px solid rgba(0,0,0,0.06)",
        color: TOKENS.LABEL_SECONDARY,
        fontSize: 9,
      }}
    >
      <span>Scale 1:{Math.round(100 / zoom)}</span>
      {mode === "plan" && <FurnitureToggle />}
    </footer>
  );
}
