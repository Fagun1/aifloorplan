"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo } from "react";

import { useLayoutStore } from "@/store/layoutStore";
import { AnalysisPanel } from "@/components/layout/AnalysisPanel";
import { ImprovementPanel } from "@/components/layout/ImprovementPanel";

const PlanWorkspace = dynamic(
  () =>
    import("@/components/layout/premium/PlanWorkspace").then((m) => m.PlanWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-[#F3F4F6]">
        <div className="rounded-2xl bg-white p-12 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">Loading…</div>
      </div>
    ),
  },
);

export function LayoutApp() {
  const {
    request,
    response,
    editedCandidate,
    roomViolations,
    selectedCandidateId,
    isLoading,
    error,
    setSeed,
    setSetback,
    setNumCandidates,
    selectCandidate,
    updateRoomPolygon,
    highlightedRoom,
    runGeneration,
  } = useLayoutStore();

  useEffect(() => {
    void runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidate = useMemo(() => {
    if (editedCandidate) return editedCandidate;
    if (!response) return null;
    if (selectedCandidateId == null) return response.candidates[0] ?? null;
    return (
      response.candidates.find((c) => c.candidate_id === selectedCandidateId) ??
      null
    );
  }, [response, selectedCandidateId]);

  const plot = request.plot.points;
  const buildable = response?.buildable_polygon ?? request.plot.points;

  return (
    <div
      className="bg-[#F3F4F6] [color-scheme:light]"
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr 320px",
        height: "100vh",
      }}
    >
      <aside
        className="border-r border-gray-200 bg-white"
        style={{ padding: 16 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <h1 className="text-gray-800" style={{ fontSize: 18, fontWeight: 700 }}>
            AI Architectural Layout Studio
          </h1>
          <button
            onClick={() => void runGeneration()}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Generating…" : "🔍 Generate Layout"}
          </button>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div className="text-gray-600" style={{ fontSize: 12, opacity: 0.8 }}>generation_seed</div>
              <button
                type="button"
                onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                🎲
              </button>
            </div>
            <input
              value={request.generation_seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              type="number"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div className="text-gray-600" style={{ fontSize: 12, opacity: 0.8 }}>setback_m</div>
            <input
              value={request.setback_m}
              onChange={(e) => setSetback(Number(e.target.value))}
              type="number"
              step="0.1"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div className="text-gray-600" style={{ fontSize: 12, opacity: 0.8 }}>num_candidates</div>
            <input
              value={request.num_candidates}
              onChange={(e) => setNumCandidates(Number(e.target.value))}
              type="number"
              min={1}
              max={50}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div className="text-gray-600" style={{ fontSize: 12, opacity: 0.8 }}>Candidate</div>
            <select
              value={candidate?.candidate_id ?? ""}
              onChange={(e) => selectCandidate(Number(e.target.value))}
              disabled={!response || response.candidates.length === 0}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
            >
              {(response?.candidates ?? []).map((c) => (
                <option key={c.candidate_id} value={c.candidate_id}>
                  #{c.candidate_id} — total {c.scores.total.toFixed(3)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ height: 12 }} />

        {error ? (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(239, 68, 68, 0.4)",
              background: "rgba(239, 68, 68, 0.08)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        ) : null}

        {candidate ? (
          <div
            className="text-gray-700"
            style={{
              marginTop: 14,
              fontSize: 12,
              opacity: 0.85,
              display: "grid",
              gap: 6,
            }}
          >
            <div>
              Rooms: <b>{candidate.rooms.length}</b>
            </div>
            <div>
              Adjacency edges: <b>{candidate.adjacency.length}</b>
            </div>
            <div>
              Circulation paths: <b>{candidate.circulation_paths.length}</b>
            </div>
          </div>
        ) : null}
      </aside>

      <main className="min-w-0 flex-1 bg-[#F3F4F6]">
        <PlanWorkspace
          plotPolygon={plot}
          buildablePolygon={buildable}
          candidate={candidate}
        />
      </main>
      <div className="flex flex-col border-l border-gray-200 bg-white p-4 overflow-auto">
        <AnalysisPanel />
        <ImprovementPanel />
      </div>
    </div>
  );
}

