"use client";

import React, { useMemo } from "react";

import { useLayoutStore } from "@/store/layoutStore";
import { AnalysisPanel } from "@/components/layout/AnalysisPanel";

function renderTextWithRoomLinks(
  text: string,
  roomNames: string[],
  onClickRoom: (name: string) => void,
) {
  if (!roomNames.length) return <span>{text}</span>;

  const escaped = roomNames
    .filter((n) => n && typeof n === "string")
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return <span>{text}</span>;

  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const name = match[0];
    parts.push(
      <button
        key={`${name}-${start}`}
        type="button"
        onClick={() => onClickRoom(name)}
        className="border-none bg-transparent p-0 cursor-pointer text-blue-600 underline"
      >
        {name}
      </button>,
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <span>{parts}</span>;
}

export function ImprovementPanel() {
  const {
    response,
    editedCandidate,
    selectedCandidateId,
    improvementExplanation,
    improvementExplanationLoading,
    improvementExplanationError,
    runExplainImprovement,
    setHighlightedRoom,
    request,
  } = useLayoutStore();

  const candidate = useMemo(() => {
    if (editedCandidate) return editedCandidate;
    if (!response) return null;
    if (selectedCandidateId == null) return response.candidates[0] ?? null;
    return (
      response.candidates.find((c) => c.candidate_id === selectedCandidateId) ??
      null
    );
  }, [editedCandidate, response, selectedCandidateId]);

  const roomNames = useMemo(
    () => (candidate ? candidate.rooms.map((r) => r.name) : []),
    [candidate],
  );

  const onExplainClick = () => {
    void runExplainImprovement(request.plot.gate_direction);
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-gray-800">Optimization Explanation</div>
          <div className="text-[11px] text-gray-600">
            Compare current layout to its original candidate.
          </div>
        </div>
        <button
          type="button"
          onClick={onExplainClick}
          disabled={!candidate || improvementExplanationLoading}
          className="rounded-full border border-sky-300 bg-sky-500 px-2 py-1 text-[10px] text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
        >
          {improvementExplanationLoading ? "Explaining…" : "🔄 Explain Optimization"}
        </button>
      </div>

      {improvementExplanationError ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {improvementExplanationError}
        </div>
      ) : null}

      {improvementExplanation ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
          <div className="mb-1.5 font-semibold">Summary</div>
          <p className="mb-2 mt-0">
            {improvementExplanation.summary}
          </p>

          <div className="mb-1 font-semibold">Key changes</div>
          {improvementExplanation.key_changes.length === 0 ? (
            <p className="opacity-75">No major changes detected.</p>
          ) : (
            <ul className="mb-2 ml-4 list-disc pl-0">
              {improvementExplanation.key_changes.map((t, i) => (
                <li key={i}>
                  {renderTextWithRoomLinks(t, roomNames, setHighlightedRoom)}
                </li>
              ))}
            </ul>
          )}

          <div className="mb-1 font-semibold">Why score changed</div>
          {improvementExplanation.why_score_improved.length === 0 ? (
            <p className="opacity-75">No explicit reason given.</p>
          ) : (
            <ul className="mb-2 ml-4 list-disc pl-0">
              {improvementExplanation.why_score_improved.map((t, i) => (
                <li key={i}>
                  {renderTextWithRoomLinks(t, roomNames, setHighlightedRoom)}
                </li>
              ))}
            </ul>
          )}

          <div className="mb-1 font-semibold">Tradeoffs</div>
          {improvementExplanation.tradeoffs.length === 0 ? (
            <p className="opacity-75">No tradeoffs surfaced.</p>
          ) : (
            <ul className="mb-2 ml-4 list-disc pl-0">
              {improvementExplanation.tradeoffs.map((t, i) => (
                <li key={i}>
                  {renderTextWithRoomLinks(t, roomNames, setHighlightedRoom)}
                </li>
              ))}
            </ul>
          )}

          <div className="mb-1 font-semibold">Rooms most affected</div>
          {improvementExplanation.rooms_most_affected.length === 0 ? (
            <p className="opacity-75">No specific rooms highlighted.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {improvementExplanation.rooms_most_affected.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setHighlightedRoom(name)}
                  className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 cursor-pointer hover:bg-emerald-200"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

