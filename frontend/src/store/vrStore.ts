"use client";

import { create } from "zustand";

export type VRRoom = {
    id: string;
    name: string;
    category: string;
    floor: number;
    position: [number, number, number];
    size: [number, number, number];
    polygon_2d: [number, number][];
    material: {
        wall: string;
        floor: string;
        ceiling: string;
        roughness: number;
        metalness: number;
    };
    light: {
        position: [number, number, number];
        intensity: number;
        color: string;
        cast_shadow: boolean;
    };
    furniture: VRFurniture[];
};

export type VRFurniture = {
    type: string;
    position: [number, number, number];
    rotation_y: number;
    size: [number, number, number];
    color: string;
};

export type VRScene = {
    scene_version: string;
    floor_number: number;
    rooms: VRRoom[];
    ambient_light: { intensity: number; color: string };
    sun_light: { direction: number[]; intensity: number; color: string; cast_shadow: boolean };
    sky: { type: string; top: string; bottom: string };
    bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
    stats: { room_count: number; total_area_m2: number; furniture_count: number };
};

type VRState = {
    scene: VRScene | null;
    selectedRoom: string | null;
    activeFloor: number;
    isLoading: boolean;
    error: string | null;
    showFurniture: boolean;
    showLabels: boolean;
    showLighting: boolean;
    cameraMode: "orbit" | "walk" | "top";

    setScene: (scene: VRScene) => void;
    setSelectedRoom: (id: string | null) => void;
    setActiveFloor: (floor: number) => void;
    setLoading: (v: boolean) => void;
    setError: (e: string | null) => void;
    toggleFurniture: () => void;
    toggleLabels: () => void;
    toggleLighting: () => void;
    setCameraMode: (mode: "orbit" | "walk" | "top") => void;
    fetchScene: (projectId: string, floor?: number) => Promise<void>;
};

export const useVRStore = create<VRState>((set, get) => ({
    scene: null,
    selectedRoom: null,
    activeFloor: 0,
    isLoading: false,
    error: null,
    showFurniture: true,
    showLabels: true,
    showLighting: true,
    cameraMode: "orbit",

    setScene: (scene) => set({ scene }),
    setSelectedRoom: (id) => set({ selectedRoom: id }),
    setActiveFloor: (floor) => set({ activeFloor: floor }),
    setLoading: (v) => set({ isLoading: v }),
    setError: (e) => set({ error: e }),
    toggleFurniture: () => set((s) => ({ showFurniture: !s.showFurniture })),
    toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
    toggleLighting: () => set((s) => ({ showLighting: !s.showLighting })),
    setCameraMode: (mode) => set({ cameraMode: mode }),

    fetchScene: async (projectId, floor = 0) => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem("auth_token");
            const resp = await fetch(`/api/v1/vr/scene/${projectId}?floor=${floor}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.detail ?? `HTTP ${resp.status}`);
            }
            const data = await resp.json();
            set({ scene: data, activeFloor: floor });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : String(e) });
        } finally {
            set({ isLoading: false });
        }
    },
}));
