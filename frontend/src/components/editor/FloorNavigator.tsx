"use client";
/**
 * FloorNavigator — ▲/▼ floor switching with floor info display.
 */
import { useStudioStore } from "@/store/studioStore";

interface Props {
    totalFloors: number;
    floorRoomCounts?: number[]; // optional per-floor room count
}

export function FloorNavigator({ totalFloors, floorRoomCounts }: Props) {
    const { floorIndex, setFloorIndex } = useStudioStore();

    if (totalFloors <= 1) return null;

    const floorNames = Array.from({ length: totalFloors }, (_, i) =>
        i === 0 ? "Ground" : i === 1 ? "First" : i === 2 ? "Second" : `${i}${["th", "st", "nd", "rd"][Math.min(i % 10, 3)]}`
    );

    return (
        <div style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "rgba(13,13,20,0.9)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: "8px 6px",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-md)",
        }}>
            {/* Up arrow */}
            <button
                className="btn btn-secondary btn-sm"
                style={{ width: 32, height: 32, padding: 0, fontSize: 14 }}
                onClick={() => setFloorIndex(Math.max(0, floorIndex - 1))}
                disabled={floorIndex === 0}
                data-tooltip="Previous floor"
            >▲</button>

            {/* Floor indicators (top = highest floor) */}
            {Array.from({ length: totalFloors })
                .map((_, i) => totalFloors - 1 - i)
                .map(fi => (
                    <button
                        key={fi}
                        onClick={() => setFloorIndex(fi)}
                        style={{
                            width: 48,
                            height: 40,
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${fi === floorIndex ? "var(--brand-primary)" : "var(--border-subtle)"}`,
                            background: fi === floorIndex ? "rgba(108,99,255,0.2)" : "var(--bg-glass)",
                            color: fi === floorIndex ? "var(--brand-primary)" : "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: fi === floorIndex ? 700 : 400,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            transition: "all 0.15s",
                        }}
                    >
                        <span>{fi + 1}</span>
                        {floorRoomCounts && (
                            <span style={{ fontSize: 9, opacity: 0.6 }}>{floorRoomCounts[fi] ?? 0}r</span>
                        )}
                    </button>
                ))}

            {/* Down arrow */}
            <button
                className="btn btn-secondary btn-sm"
                style={{ width: 32, height: 32, padding: 0, fontSize: 14 }}
                onClick={() => setFloorIndex(Math.min(totalFloors - 1, floorIndex + 1))}
                disabled={floorIndex === totalFloors - 1}
                data-tooltip="Next floor"
            >▼</button>

            {/* Current floor label */}
            <div style={{
                marginTop: 4,
                fontSize: 9,
                color: "var(--text-muted)",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
            }}>
                {floorNames[floorIndex]} Fl.
            </div>
        </div>
    );
}
