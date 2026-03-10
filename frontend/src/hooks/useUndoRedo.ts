/**
 * useUndoRedo — keyboard-driven undo/redo history stack.
 * Works with any JSON-serializable state snapshot.
 */
import { useEffect, useRef, useCallback } from "react";

interface Options<T> {
    state: T;
    onUndo: (state: T) => void;
    onRedo: (state: T) => void;
    maxHistory?: number;
}

export function useUndoRedo<T>({ state, onUndo, onRedo, maxHistory = 50 }: Options<T>) {
    const past = useRef<T[]>([]);
    const future = useRef<T[]>([]);
    const skipNext = useRef(false);

    // Push to history when state changes (unless triggered by undo/redo)
    const prevState = useRef<T>(state);
    useEffect(() => {
        if (skipNext.current) {
            skipNext.current = false;
            prevState.current = state;
            return;
        }
        const prev = prevState.current;
        if (JSON.stringify(prev) !== JSON.stringify(state)) {
            past.current = [...past.current.slice(-maxHistory + 1), prev];
            future.current = [];
            prevState.current = state;
        }
    }, [state, maxHistory]);

    const undo = useCallback(() => {
        if (past.current.length === 0) return;
        const previous = past.current[past.current.length - 1];
        past.current = past.current.slice(0, -1);
        future.current = [state, ...future.current];
        skipNext.current = true;
        onUndo(previous);
    }, [state, onUndo]);

    const redo = useCallback(() => {
        if (future.current.length === 0) return;
        const next = future.current[0];
        future.current = future.current.slice(1);
        past.current = [...past.current, state];
        skipNext.current = true;
        onRedo(next);
    }, [state, onRedo]);

    // Keyboard bindings
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
                e.preventDefault();
                redo();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    return {
        undo,
        redo,
        canUndo: past.current.length > 0,
        canRedo: future.current.length > 0,
    };
}
