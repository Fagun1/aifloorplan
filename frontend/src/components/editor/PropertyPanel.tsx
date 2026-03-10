"use client";
/**
 * PropertyPanel — shows selected room details and allows editing.
 */
import { useEditorStore } from "@/store/editorStore";
import { useLayoutStore } from "@/store/layoutStore";
import type { RoomPlacement } from "@/lib/types";

export function PropertyPanel() {
    const { selectedRoomName, violations } = useEditorStore();
    const { editedCandidate } = useLayoutStore();

    if (!selectedRoomName || !editedCandidate) {
        return (
            <div style={{
                padding: "20px 16px",
                borderLeft: "1px solid var(--border-subtle)",
                background: "rgba(13,13,20,0.6)",
                width: 240,
                minHeight: 200,
                color: "var(--text-muted)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
            }}>
                <span style={{ fontSize: 24 }}>↖</span>
                <p>Click a room to inspect</p>
            </div>
        );
    }

    const room: RoomPlacement | undefined = editedCandidate.rooms.find(
        (r) => r.name === selectedRoomName
    );
    if (!room) return null;

    const roomViolations = violations.filter(v => v.room_name === selectedRoomName);
    const hasViolation = roomViolations.length > 0;

    // Bounding box dimensions
    const xs = room.polygon.map(p => p[0]);
    const ys = room.polygon.map(p => p[1]);
    const widthM = Math.max(...xs) - Math.min(...xs);
    const heightM = Math.max(...ys) - Math.min(...ys);

    const CATEGORY_COLOR: Record<string, string> = {
        public: "#6c63ff",
        private: "#48c9b0",
        service: "#f5c842",
    };
    const catColor = CATEGORY_COLOR[room.category] ?? "var(--brand-primary)";

    return (
        <div style={{
            width: 240,
            borderLeft: "1px solid var(--border-subtle)",
            background: "rgba(13,13,20,0.95)",
            overflowY: "auto",
            backdropFilter: "blur(12px)",
        }}>
            {/* Header */}
            <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${catColor}`,
            }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    {room.name}
                </p>
                <span className="badge" style={{
                    background: catColor + "20",
                    color: catColor,
                    fontSize: 10,
                }}>
                    {room.category}
                </span>
            </div>

            {/* Dimensions */}
            <div style={{ padding: "14px 16px" }}>
                <p className="input-label" style={{ marginBottom: 10 }}>Dimensions</p>

                <Row label="Area" value={`${room.area_m2.toFixed(2)} m²`} />
                <Row label="Target" value={`${room.target_area.toFixed(1)} m²`}
                    color={(room.area_m2 / room.target_area) >= 0.85 ? "var(--green)" : "var(--yellow)"} />
                <Row label="Width" value={`${widthM.toFixed(2)} m`} />
                <Row label="Depth" value={`${heightM.toFixed(2)} m`} />
                <Row label="Aspect" value={(Math.max(widthM, heightM) / Math.min(widthM, heightM)).toFixed(2)}
                    color={(Math.max(widthM, heightM) / Math.min(widthM, heightM)) <= 2 ? "var(--green)" : "var(--yellow)"} />
                <Row label="Centroid"
                    value={`(${room.centroid[0].toFixed(1)}, ${room.centroid[1].toFixed(1)})`} />
            </div>

            {/* Constraint status */}
            <div style={{ padding: "0 16px 14px" }}>
                <p className="input-label" style={{ marginBottom: 10 }}>Constraints</p>
                {hasViolation ? (
                    roomViolations.map((v, i) => (
                        <div key={i} className="badge badge-red" style={{ marginBottom: 6, display: "inline-flex" }}>
                            ⚠ {v.rules.join(", ").replace(/_/g, " ")}
                        </div>
                    ))
                ) : (
                    <div className="badge badge-green">✓ All satisfied</div>
                )}
            </div>

            {/* Area utilisation bar */}
            <div style={{ padding: "0 16px 16px" }}>
                <p className="input-label" style={{ marginBottom: 6 }}>Area Utilisation</p>
                <div className="score-bar">
                    <div className="score-bar-fill"
                        style={{ width: `${Math.min(100, (room.area_m2 / room.target_area) * 100)}%` }} />
                </div>
                <p className="text-muted" style={{ fontSize: 10, marginTop: 4 }}>
                    {((room.area_m2 / room.target_area) * 100).toFixed(0)}% of target
                </p>
            </div>
        </div>
    );
}

function Row({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div className="flex justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: color ?? "var(--text-primary)" }}>{value}</span>
        </div>
    );
}
