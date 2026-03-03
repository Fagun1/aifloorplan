"use client";

import React, { useState, useEffect } from "react";
import { useLayoutStore } from "@/store/layoutStore";
import { useStudioStore } from "@/store/studioStore";
import { TOKENS } from "@/studio/tokens";
import type { StructuredQuestionOut } from "@/lib/types";

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: StructuredQuestionOut;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  const { text, type, options } = question;
  const hasOptions = options?.length > 0;

  if (type === "boolean" || (hasOptions && type !== "numeric" && type !== "text")) {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs" style={{ color: TOKENS.LABEL_PRIMARY }}>
          {text}
        </span>
        <select
          value={String(value ?? question.default ?? options?.[0] ?? "")}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "true") onChange(true);
            else if (v === "false") onChange(false);
            else onChange(v);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "rgba(0,0,0,0.1)",
            color: TOKENS.LABEL_PRIMARY,
          }}
        >
          {type === "boolean" ? (
            <>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </>
          ) : (
            options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))
          )}
        </select>
      </label>
    );
  }

  if (type === "numeric") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs" style={{ color: TOKENS.LABEL_PRIMARY }}>
          {text}
        </span>
        <input
          type="number"
          value={value !== undefined ? String(value) : ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="rounded-lg border px-3 py-2"
          style={{
            borderColor: "rgba(0,0,0,0.1)",
            color: TOKENS.LABEL_PRIMARY,
          }}
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: TOKENS.LABEL_PRIMARY }}>
        {text}
      </span>
      <input
        type="text"
        value={value !== undefined ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border px-3 py-2"
        style={{
          borderColor: "rgba(0,0,0,0.1)",
          color: TOKENS.LABEL_PRIMARY,
        }}
      />
    </label>
  );
}

export function ParameterPanel() {
  const {
    request,
    response,
    runGeneration,
    isLoading,
    error,
    setSetback,
    setNumCandidates,
    setPlotPoints,
    setUserAnswers,
  } = useLayoutStore();
  const { setMode, setShowParameterPanel, draftPolygon } = useStudioStore();
  const [localSetback, setLocalSetback] = useState(String(request.setback_m));
  const [localCandidates, setLocalCandidates] = useState(
    String(request.num_candidates)
  );
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | number | boolean>
  >({});

  const pendingQuestions = response?.pending_questions ?? [];

  useEffect(() => {
    const questions = response?.pending_questions ?? [];
    if (questions.length === 0) return;
    setQuestionAnswers((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const q of questions) {
        if (prev[q.id] === undefined) {
          next[q.id] = (q.default ?? q.options?.[0] ?? "") as
            | string
            | number
            | boolean;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [response?.pending_questions]);

  const handleQuestionChange = (id: string, value: string | number | boolean) => {
    setQuestionAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenerate = async () => {
    const PIXELS_PER_METER = 10;
    const meterPoints: [number, number][] = draftPolygon.map(([px, py]) => [
      px / PIXELS_PER_METER,
      py / PIXELS_PER_METER,
    ]);
    setPlotPoints(meterPoints);
    setSetback(Number(localSetback));
    setNumCandidates(Number(localCandidates));
    setUserAnswers(
      Object.keys(questionAnswers).length ? questionAnswers : null
    );
    await runGeneration();
    const state = useLayoutStore.getState();
    if (state.error) return;
    if (!state.response?.candidates?.length) {
      const pending = state.response?.pending_questions;
      if (pending?.length) {
        useLayoutStore.setState({
          error: "Please answer the questions above, or reduce setback and try again.",
        });
      } else {
        useLayoutStore.setState({
          error: "No layouts could fit. Draw a larger plot (aim for ~20×15 m or bigger) or reduce setback.",
        });
      }
      return;
    }
    setMode("plan");
    setShowParameterPanel(false);
  };

  const canGenerate = draftPolygon.length >= 3;

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
          Parameters
        </h2>
        <button
          type="button"
          onClick={() => setShowParameterPanel(false)}
          className="text-lg leading-none"
          style={{ color: TOKENS.LABEL_SECONDARY }}
        >
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        <label className="flex flex-col gap-1">
          <span
            className="text-xs"
            style={{ color: TOKENS.LABEL_SECONDARY }}
          >
            Setback (m)
          </span>
          <input
            type="number"
            value={localSetback}
            onChange={(e) => setLocalSetback(e.target.value)}
            step="0.1"
            min="0"
            className="rounded-lg border px-3 py-2"
            style={{
              borderColor: "rgba(0,0,0,0.1)",
              color: TOKENS.LABEL_PRIMARY,
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span
            className="text-xs"
            style={{ color: TOKENS.LABEL_SECONDARY }}
          >
            Layout variants
          </span>
          <input
            type="number"
            value={localCandidates}
            onChange={(e) => setLocalCandidates(e.target.value)}
            min="1"
            max="20"
            className="rounded-lg border px-3 py-2"
            style={{
              borderColor: "rgba(0,0,0,0.1)",
              color: TOKENS.LABEL_PRIMARY,
            }}
          />
        </label>
        {pendingQuestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <span
              className="text-xs font-medium"
              style={{ color: TOKENS.LABEL_PRIMARY }}
            >
              Answer these to generate a layout
            </span>
            {pendingQuestions.map((q) => (
              <QuestionInput
                key={q.id}
                question={q}
                value={questionAnswers[q.id]}
                onChange={(v) => handleQuestionChange(q.id, v)}
              />
            ))}
          </div>
        )}
        {error && (
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ background: "rgba(192,57,43,0.1)", color: TOKENS.ERROR }}
          >
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isLoading}
          className="mt-4 rounded-lg px-4 py-3 text-sm font-medium uppercase"
          style={{
            background: canGenerate && !isLoading ? TOKENS.ACCENT : "#ccc",
            color: TOKENS.PAPER_WHITE,
          }}
        >
          {isLoading ? "Generating…" : "Generate Plan"}
        </button>
      </div>
    </div>
  );
}
