"use client";

import React from "react";
import { FloorSelector } from "./FloorSelector";
import { TOKENS } from "@/studio/tokens";
import { useStudioStore } from "@/store/studioStore";
import type { LayoutCandidate } from "@/lib/types";

type Props = {
  candidate: LayoutCandidate | null;
};

export function LeftRail({ candidate }: Props) {
  const { mode } = useStudioStore();
  const numFloors = 1;

  if (mode !== "plan") return null;
  if (numFloors <= 1) return null;

  return (
    <aside
      className="flex w-12 shrink-0 flex-col items-center gap-2 border-r py-4"
      style={{
        background: TOKENS.PAPER_WHITE,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <FloorSelector floorIndex={0} numFloors={numFloors} />
    </aside>
  );
}
