"use client";

import React from "react";
import { useLayoutStore } from "@/store/layoutStore";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";

export function AdvancedOverlay() {
  const { isAdvancedMode } = useStudioStore();
  const { request, response, editedCandidate, selectedCandidateId } =
    useLayoutStore();

  if (!isAdvancedMode) return null;

  const candidate = editedCandidate ?? response?.candidates.find(
    (c) => c.candidate_id === selectedCandidateId
  ) ?? response?.candidates[0] ?? null;

  return (
    <div
      className="absolute right-0 top-12 z-50 flex w-80 flex-col overflow-auto rounded-r-lg border-l p-4"
      style={{
        background: "#F5F3EE",
        borderColor: "rgba(0,0,0,0.08)",
        fontFamily: "monospace",
        fontSize: 11,
        maxHeight: "calc(100vh - 96px)",
      }}
    >
      <h3 className="mb-2 font-semibold" style={{ color: TOKENS.LABEL_PRIMARY }}>
        Engine
      </h3>
      <div className="space-y-1" style={{ color: TOKENS.LABEL_SECONDARY }}>
        <div>Seed: {request.generation_seed}</div>
        <div>Candidates: {response?.candidates.length ?? 0}</div>
        {candidate && (
          <>
            <div>Selected: #{candidate.candidate_id}</div>
            <div>Pareto rank: {candidate.scores.pareto_rank ?? "—"}</div>
            {candidate.scores.dimension_scores && (
              <div className="mt-2">
                <div className="mb-1 font-semibold">Scores:</div>
                {Object.entries(candidate.scores.dimension_scores).map(
                  ([k, v]) => (
                    <div key={k}>
                      {k}: {typeof v === "number" ? v.toFixed(3) : v}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
