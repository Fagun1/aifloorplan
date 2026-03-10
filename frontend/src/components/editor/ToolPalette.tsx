"use client";
/**
 * ToolPalette — editor tool buttons shown above the canvas.
 */
import { useEditorStore, type EditorTool } from "@/store/editorStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useLayoutStore } from "@/store/layoutStore";

const TOOLS: { id: EditorTool; icon: string; label: string; shortcut: string }[] = [
    { id: "select", icon: "↖", label: "Select", shortcut: "V" },
    { id: "move", icon: "✥", label: "Move", shortcut: "M" },
    { id: "add", icon: "+", label: "Add Room", shortcut: "A" },
    { id: "delete", icon: "🗑", label: "Delete", shortcut: "Del" },
];

export function ToolPalette() {
    const { activeTool, setTool, snapToGrid, snapToWall, toggleSnapGrid, toggleSnapWall, isConnected } = useEditorStore();
    const { editedCandidate, setEditedCandidate } = useLayoutStore();

    const { undo, redo, canUndo, canRedo } = useUndoRedo({
        state: editedCandidate,
        onUndo: (s) => setEditedCandidate(s),
        onRedo: (s) => setEditedCandidate(s),
    });

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(13,13,20,0.95)",
            borderBottom: "1px solid var(--border-subtle)",
            backdropFilter: "blur(12px)",
            flexWrap: "wrap",
        }}>
            {/* Tool buttons */}
            <div style={{ display: "flex", gap: 4 }}>
                {TOOLS.map(t => (
                    <button
                        key={t.id}
                        data-tooltip={`${t.label} (${t.shortcut})`}
                        onClick={() => setTool(t.id)}
                        className="btn btn-sm"
                        style={{
                            background: activeTool === t.id ? "var(--brand-primary)" : "var(--bg-glass)",
                            color: activeTool === t.id ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${activeTool === t.id ? "var(--brand-primary)" : "var(--border-default)"}`,
                            fontSize: 16,
                            width: 36,
                            height: 36,
                            padding: 0,
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            <div style={{ width: 1, height: 28, background: "var(--border-subtle)" }} />

            {/* Undo / Redo */}
            <div style={{ display: "flex", gap: 4 }}>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={undo}
                    disabled={!canUndo}
                    data-tooltip="Undo (Ctrl+Z)"
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                >↩</button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={redo}
                    disabled={!canRedo}
                    data-tooltip="Redo (Ctrl+Y)"
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                >↪</button>
            </div>

            <div style={{ width: 1, height: 28, background: "var(--border-subtle)" }} />

            {/* Snap toggles */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <SnapToggle active={snapToGrid} onToggle={toggleSnapGrid} label="Grid Snap" />
                <SnapToggle active={snapToWall} onToggle={toggleSnapWall} label="Wall Snap" />
            </div>

            {/* WS status */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: isConnected ? "var(--green)" : "var(--red)",
                    boxShadow: isConnected ? "0 0 6px var(--green)" : "none",
                }} />
                <span style={{ color: "var(--text-muted)" }}>
                    {isConnected ? "Live sync" : "Offline"}
                </span>
            </div>
        </div>
    );
}

function SnapToggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
    return (
        <button
            className="btn btn-sm"
            onClick={onToggle}
            style={{
                background: active ? "rgba(72,201,176,0.15)" : "var(--bg-glass)",
                color: active ? "var(--green)" : "var(--text-muted)",
                border: `1px solid ${active ? "rgba(72,201,176,0.4)" : "var(--border-subtle)"}`,
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
            }}
        >
            {active ? "✓" : "○"} {label}
        </button>
    );
}
