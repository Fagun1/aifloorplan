"use client";

import { create } from "zustand";

import { analyzeLayout, explainImprovement, generateLayouts } from "@/lib/apiClient";
import { validateCandidateConstraints, type RoomViolations } from "@/lib/constraints";
import {
  type AnalyzeLayoutResponse,
  type ExplainImprovementResponse,
  type GenerateLayoutsRequest,
  type GenerateLayoutsResponse,
  type LayoutCandidate,
} from "@/lib/types";

type LayoutState = {
  request: GenerateLayoutsRequest;
  response: GenerateLayoutsResponse | null;
  editedCandidate: LayoutCandidate | null;
  roomViolations: RoomViolations;
  selectedCandidateId: number | null;
  isLoading: boolean;
  error: string | null;

  analysis: AnalyzeLayoutResponse | null;
  analysisForCandidateId: number | null;
  analysisLoading: boolean;
  analysisOutdated: boolean;
  highlightedRoom: string | null;

  improvementExplanation: ExplainImprovementResponse | null;
  improvementExplanationLoading: boolean;
  improvementExplanationError: string | null;

  setSeed: (seed: number) => void;
  setSetback: (setback: number) => void;
  setNumCandidates: (n: number) => void;
  setPlotPoints: (points: [number, number][]) => void;
  setUserAnswers: (answers: Record<string, string | number | boolean> | null) => void;
  selectCandidate: (candidateId: number) => void;
  updateRoomPolygon: (roomName: string, polygon: [number, number][]) => void;
  setEditedCandidate: (candidate: LayoutCandidate | null) => void;
  runGeneration: () => Promise<void>;
  runAnalysis: (gate_direction: string) => Promise<void>;
  setHighlightedRoom: (roomName: string | null) => void;
  runExplainImprovement: (gate_direction: string) => Promise<void>;
};

const defaultRequest: GenerateLayoutsRequest = {
  plot: {
    vertices: [
      [0, 0],
      [20, 0],
      [20, 10],
      [12, 14],
      [0, 10],
    ],
    gate_direction: "south",
  },
  rooms: [
    { name: "Living", target_area: 40, category: "public" },
    { name: "Kitchen", target_area: 20, category: "service" },
    { name: "Bed1", target_area: 18, category: "private" },
    { name: "Bed2", target_area: 18, category: "private" },
  ],
  setback_m: 1,
  num_candidates: 5,
  generation_seed: 1234,
};

export const useLayoutStore = create<LayoutState>((set, get) => ({
  request: defaultRequest,
  response: null,
  editedCandidate: null,
  roomViolations: {},
  selectedCandidateId: null,
  isLoading: false,
  error: null,

  analysis: null,
  analysisForCandidateId: null,
  analysisLoading: false,
  analysisOutdated: false,
  highlightedRoom: null,

  improvementExplanation: null,
  improvementExplanationLoading: false,
  improvementExplanationError: null,

  setSeed: (seed) =>
    set((s) => ({ request: { ...s.request, generation_seed: seed } })),
  setSetback: (setback) =>
    set((s) => ({ request: { ...s.request, setback_m: setback } })),
  setNumCandidates: (n) =>
    set((s) => ({ request: { ...s.request, num_candidates: n } })),
  setPlotPoints: (points) =>
    set((s) => ({
      request: {
        ...s.request,
        plot: { ...s.request.plot, vertices: points },
      },
    })),

  setEditedCandidate: (candidate) => set({ editedCandidate: candidate }),

  setUserAnswers: (answers) =>
    set((s) => ({ request: { ...s.request, user_answers: answers ?? undefined } })),

  selectCandidate: (candidateId) =>
    set((state) => {
      const base =
        state.response?.candidates.find((c) => c.candidate_id === candidateId) ??
        null;
      let editedCandidate: LayoutCandidate | null = null;
      let roomViolations: RoomViolations = {};
      let analysisOutdated = state.analysisOutdated;
      if (base && state.response) {
        editedCandidate = {
          ...base,
          rooms: base.rooms.map((r) => ({
            ...r,
            polygon: r.polygon.map(([x, y]) => [x, y] as [number, number]),
            centroid: [r.centroid[0], r.centroid[1]],
          })),
        };
        roomViolations = validateCandidateConstraints(
          editedCandidate,
          state.response.buildable_polygon,
          { minDimensionM: 2.0 },
        );
        if (
          state.analysis &&
          state.analysisForCandidateId !== editedCandidate.candidate_id
        ) {
          analysisOutdated = true;
        }
      }
      return {
        selectedCandidateId: candidateId,
        editedCandidate,
        roomViolations,
        analysisOutdated,
      };
    }),

  updateRoomPolygon: (roomName, polygon) =>
    set((state) => {
      if (!state.editedCandidate || !state.response) return state;
      const rooms = state.editedCandidate.rooms.map((r) =>
        r.name === roomName
          ? {
            ...r,
            polygon: polygon.map(([x, y]) => [x, y] as [number, number]),
          }
          : r,
      );
      const updated: LayoutCandidate = { ...state.editedCandidate, rooms };
      const roomViolations = validateCandidateConstraints(
        updated,
        state.response.buildable_polygon,
        { minDimensionM: 2.0 },
      );
      return {
        editedCandidate: updated,
        roomViolations,
        analysisOutdated: state.analysis ? true : state.analysisOutdated,
      };
    }),

  runGeneration: async () => {
    set({ isLoading: true, error: null });
    try {
      const req = get().request;
      const response = await generateLayouts(req);
      const first = response.candidates[0]?.candidate_id ?? null;
      let editedCandidate: LayoutCandidate | null = null;
      let roomViolations: RoomViolations = {};
      if (first !== null) {
        const base =
          response.candidates.find((c) => c.candidate_id === first) ?? null;
        if (base) {
          editedCandidate = {
            ...base,
            rooms: base.rooms.map((r) => ({
              ...r,
              polygon: r.polygon.map(([x, y]) => [x, y] as [number, number]),
              centroid: [r.centroid[0], r.centroid[1]],
            })),
          };
          roomViolations = validateCandidateConstraints(
            editedCandidate,
            response.buildable_polygon,
            { minDimensionM: 2.0 },
          );
        }
      }
      set({
        response,
        editedCandidate,
        roomViolations,
        selectedCandidateId: first,
        isLoading: false,
        error: null,
        // new generation invalidates previous analysis
        analysisOutdated: Boolean(get().analysis),
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  runAnalysis: async (gate_direction: string) => {
    const state = get();
    const candidate = state.editedCandidate
      ? state.editedCandidate
      : state.response?.candidates.find(
        (c) => c.candidate_id === state.selectedCandidateId,
      ) ?? state.response?.candidates[0];

    if (!candidate) {
      return;
    }

    set({ analysisLoading: true });
    try {
      const result = await analyzeLayout(candidate, gate_direction);
      set({
        analysis: result,
        analysisForCandidateId: candidate.candidate_id,
        analysisLoading: false,
        analysisOutdated: false,
      });
    } catch (e) {
      set({
        analysisLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  runExplainImprovement: async (gate_direction: string) => {
    const state = get();
    const baseOriginal =
      state.response?.candidates.find(
        (c) => c.candidate_id === state.selectedCandidateId,
      ) ?? state.response?.candidates[0];
    const improved = state.editedCandidate ?? baseOriginal;

    if (!baseOriginal || !improved) {
      return;
    }

    set({ improvementExplanationLoading: true, improvementExplanationError: null });
    try {
      const result = await explainImprovement(baseOriginal, improved, gate_direction);
      set({
        improvementExplanation: result,
        improvementExplanationLoading: false,
        improvementExplanationError: null,
      });
    } catch (e) {
      set({
        improvementExplanationLoading: false,
        improvementExplanationError: e instanceof Error ? e.message : String(e),
      });
    }
  },

  setHighlightedRoom: (roomName) => set({ highlightedRoom: roomName }),
}));

