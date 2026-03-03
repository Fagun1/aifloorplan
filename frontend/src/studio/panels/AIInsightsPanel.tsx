"use client";

import React from "react";
import { useLayoutStore } from "@/store/layoutStore";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";

export function AIInsightsPanel() {
  const { analysis, analysisLoading, runAnalysis, request } = useLayoutStore();
  const { setShowAIPanel } = useStudioStore();

  const handleAnalyze = () => {
    void runAnalysis(request.plot.gate_direction);
  };

  return (
    <div
      className="flex w-80 flex-col overflow-hidden rounded-r-lg"
      style={{
        background: TOKENS.PAPER_WHITE,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "rgba(0,0,0,0.06)" }}
      >
        <h2
          className="text-sm font-semibold uppercase"
          style={{ color: TOKENS.LABEL_PRIMARY }}
        >
          AI Insights
        </h2>
        <button
          type="button"
          onClick={() => setShowAIPanel(false)}
          className="text-lg leading-none"
          style={{ color: TOKENS.LABEL_SECONDARY }}
        >
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        {!analysis ? (
          <>
            <p
              className="text-sm"
              style={{ color: TOKENS.LABEL_SECONDARY, lineHeight: 1.6 }}
            >
              Get architectural feedback on zoning, privacy, and room
              relationships.
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="rounded-lg px-4 py-3 text-sm font-medium uppercase"
              style={{
                background: analysisLoading ? "#ccc" : TOKENS.ACCENT,
                color: TOKENS.PAPER_WHITE,
              }}
            >
              {analysisLoading ? "Analyzing…" : "AI Review"}
            </button>
          </>
        ) : (
          <div
            className="text-sm"
            style={{
              color: TOKENS.LABEL_PRIMARY,
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            <p className="mb-4">{analysis.summary}</p>
            {analysis.strengths.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-semibold uppercase text-xs">
                  Strengths
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.suggestions.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold uppercase text-xs">
                  Suggestions
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
