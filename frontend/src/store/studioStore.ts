"use client";

import { create } from "zustand";

export type StudioMode = "draft" | "plan";

type StudioState = {
  mode: StudioMode;
  isAdvancedMode: boolean;
  draftPolygon: [number, number][];
  showFurniture: boolean;
  floorIndex: number;
  showAIPanel: boolean;
  showParameterPanel: boolean;
  zoom: number;
  pan: { x: number; y: number };

  setMode: (m: StudioMode) => void;
  toggleAdvancedMode: () => void;
  setDraftPolygon: (pts: [number, number][]) => void;
  addDraftVertex: (pt: [number, number]) => void;
  removeLastDraftVertex: () => void;
  clearDraft: () => void;
  setShowFurniture: (v: boolean) => void;
  setFloorIndex: (i: number) => void;
  setShowAIPanel: (v: boolean) => void;
  setShowParameterPanel: (v: boolean) => void;
  setZoom: (z: number) => void;
  setPan: (p: { x: number; y: number }) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  mode: "draft",
  isAdvancedMode: false,
  draftPolygon: [],
  showFurniture: false,
  floorIndex: 0,
  showAIPanel: false,
  showParameterPanel: false,
  zoom: 1,
  pan: { x: 0, y: 0 },

  setMode: (m) => set({ mode: m }),
  toggleAdvancedMode: () => set((s) => ({ isAdvancedMode: !s.isAdvancedMode })),
  setDraftPolygon: (pts) => set({ draftPolygon: pts }),
  addDraftVertex: (pt) => set((s) => ({ draftPolygon: [...s.draftPolygon, pt] })),
  removeLastDraftVertex: () =>
    set((s) => ({ draftPolygon: s.draftPolygon.slice(0, -1) })),
  clearDraft: () => set({ draftPolygon: [] }),
  setShowFurniture: (v) => set({ showFurniture: v }),
  setFloorIndex: (i) => set({ floorIndex: i }),
  setShowAIPanel: (v) =>
    set((s) => ({ showAIPanel: v, showParameterPanel: v ? false : s.showParameterPanel })),
  setShowParameterPanel: (v) =>
    set((s) => ({ showParameterPanel: v, showAIPanel: v ? false : s.showAIPanel })),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(4, z)) }),
  setPan: (p) => set({ pan: p }),
}));
