"use client";

import React, { useMemo, useState } from "react";

import { useLayoutStore } from "@/store/layoutStore";

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-none bg-transparent p-0 text-left text-sm font-semibold text-gray-800 cursor-pointer"
      >
        <span>{title}</span>
        <span className="opacity-70">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="mt-1.5 text-xs leading-relaxed text-gray-700">{children}</div>
      ) : null}
    </section>
  );
}

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

export function AnalysisPanel() {
  const {
    response,
    editedCandidate,
    selectedCandidateId,
    analysis,
    analysisForCandidateId,
    analysisLoading,
    analysisOutdated,
    runAnalysis,
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

  const onAnalyzeClick = () => {
    void runAnalysis(request.plot.gate_direction);
  };

  const isOutdated =
    analysisOutdated ||
    (analysis && candidate && analysisForCandidateId !== candidate.candidate_id);

  return (
    <aside className="flex flex-col gap-3 p-0">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-gray-800">🧠 AI Architect Analysis</div>
          <div className="text-xs text-gray-600">
            Qualitative review of the current layout.
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={onAnalyzeClick}
            disabled={!candidate || analysisLoading}
            className="rounded-full border border-pink-300 bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
          >
            {analysisLoading ? "Analyzing…" : "🧠 AI Review"}
          </button>
          {analysis && isOutdated ? (
            <div className="mt-1 rounded-full border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
              Analysis outdated — re-run?
            </div>
          ) : null}
        </div>
      </div>

      {!analysis ? (
        <div className="mt-1.5 text-xs text-gray-600">
          Run an analysis to get architectural feedback on zoning, privacy, and room
          relationships. The layout will not be changed automatically.
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-1 flex flex-col gap-2.5">
          <Section title="🧠 Summary">
            <p>{analysis.summary}</p>
          </Section>

          <Section title="✅ Strengths">
            {analysis.strengths.length === 0 ? (
              <p className="opacity-70">No major strengths identified.</p>
            ) : (
              <ul className="ml-4 list-disc pl-0">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="mb-0.5">
                    {renderTextWithRoomLinks(s, roomNames, setHighlightedRoom)}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="⚠ Weaknesses" defaultOpen={false}>
            {analysis.weaknesses.length === 0 ? (
              <p className="opacity-70">No critical weaknesses detected.</p>
            ) : (
              <ul className="ml-4 list-disc pl-0">
                {analysis.weaknesses.map((s, i) => (
                  <li key={i} className="mb-0.5">
                    {renderTextWithRoomLinks(s, roomNames, setHighlightedRoom)}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="💡 Suggestions" defaultOpen={false}>
            {analysis.suggestions.length === 0 ? (
              <p className="opacity-70">No specific suggestions at this time.</p>
            ) : (
              <ul className="ml-4 list-disc pl-0">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="mb-0.5">
                    {renderTextWithRoomLinks(s, roomNames, setHighlightedRoom)}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="🏗 Architectural Notes" defaultOpen={false}>
            {analysis.architectural_notes.length === 0 ? (
              <p className="opacity-70">No additional notes.</p>
            ) : (
              <ul className="ml-4 list-disc pl-0">
                {analysis.architectural_notes.map((s, i) => (
                  <li key={i} className="mb-0.5">
                    {renderTextWithRoomLinks(s, roomNames, setHighlightedRoom)}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}
    </aside>
  );
}

