"use client";

import React from "react";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";

type Props = {
  floorIndex: number;
  numFloors: number;
};

export function FloorSelector({ floorIndex, numFloors }: Props) {
  const { setFloorIndex } = useStudioStore();

  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: numFloors }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setFloorIndex(i)}
          className="rounded-full px-2 py-1 text-xs font-semibold uppercase"
          style={{
            background: i === floorIndex ? TOKENS.ACCENT : "transparent",
            color: i === floorIndex ? TOKENS.PAPER_WHITE : TOKENS.LABEL_SECONDARY,
            border: `1px solid ${i === floorIndex ? TOKENS.ACCENT : TOKENS.LABEL_SECONDARY}`,
          }}
        >
          {i === 0 ? "G" : String(i)}
        </button>
      ))}
    </div>
  );
}
