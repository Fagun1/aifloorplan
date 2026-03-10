/**
 * Editor store — active tool, selected room, snap settings, constraint violations.
 */
import { create } from "zustand";

export type EditorTool = "select" | "move" | "add" | "delete";

export interface RoomViolation {
    room_name: string;
    rules: string[];
}

interface EditorState {
    activeTool: EditorTool;
    selectedRoomName: string | null;
    snapToGrid: boolean;
    snapToWall: boolean;
    gridSizeM: number; // default 0.5m
    violations: RoomViolation[];
    isConnected: boolean; // WebSocket connection status

    setTool: (t: EditorTool) => void;
    selectRoom: (name: string | null) => void;
    toggleSnapGrid: () => void;
    toggleSnapWall: () => void;
    setViolations: (v: RoomViolation[]) => void;
    setConnected: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTool: "select",
    selectedRoomName: null,
    snapToGrid: true,
    snapToWall: true,
    gridSizeM: 0.5,
    violations: [],
    isConnected: false,

    setTool: (t) => set({ activeTool: t }),
    selectRoom: (name) => set({ selectedRoomName: name }),
    toggleSnapGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
    toggleSnapWall: () => set((s) => ({ snapToWall: !s.snapToWall })),
    setViolations: (v) => set({ violations: v }),
    setConnected: (v) => set({ isConnected: v }),
}));
