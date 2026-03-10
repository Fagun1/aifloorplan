"use client";

import { useVRStore } from "@/store/vrStore";
import type { VRRoom } from "@/store/vrStore";

export function VRSidebar() {
    const {
        scene,
        selectedRoom,
        setSelectedRoom,
        showFurniture,
        showLabels,
        showLighting,
        toggleFurniture,
        toggleLabels,
        toggleLighting,
        cameraMode,
        setCameraMode,
        activeFloor,
    } = useVRStore();

    const selected = scene?.rooms.find((r) => r.id === selectedRoom) ?? null;

    return (
        <aside
            style={{
                width: 280,
                background: "rgba(10,10,20,0.92)",
                backdropFilter: "blur(16px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#888", textTransform: "uppercase" }}>
                    VR Walkthrough
                </div>
                {scene && (
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                        Floor {activeFloor} · {scene.stats.room_count} rooms · {Math.round(scene.stats.total_area_m2)} m²
                    </div>
                )}
            </div>

            {/* View Controls */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    Display
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                        { label: "🪑 Furniture", on: showFurniture, toggle: toggleFurniture },
                        { label: "🏷 Labels", on: showLabels, toggle: toggleLabels },
                        { label: "💡 Lighting", on: showLighting, toggle: toggleLighting },
                    ].map(({ label, on, toggle }) => (
                        <button
                            key={label}
                            onClick={toggle}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: on ? "rgba(108,99,255,0.18)" : "rgba(255,255,255,0.04)",
                                color: on ? "#a89fff" : "#666",
                                cursor: "pointer",
                                fontSize: 13,
                                transition: "all 0.15s",
                            }}
                        >
                            <span>{label}</span>
                            <span
                                style={{
                                    width: 32, height: 18, borderRadius: 9,
                                    background: on ? "#6c63ff" : "#333",
                                    display: "flex", alignItems: "center",
                                    padding: "0 3px",
                                    transition: "background 0.2s",
                                }}
                            >
                                <span
                                    style={{
                                        width: 12, height: 12, borderRadius: "50%",
                                        background: "#fff",
                                        transform: on ? "translateX(14px)" : "translateX(0)",
                                        transition: "transform 0.2s",
                                    }}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Camera modes */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    Camera
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {(["orbit", "top"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setCameraMode(mode)}
                            style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: `1px solid ${cameraMode === mode ? "#6c63ff" : "rgba(255,255,255,0.08)"}`,
                                background: cameraMode === mode ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.04)",
                                color: cameraMode === mode ? "#a89fff" : "#777",
                                cursor: "pointer",
                                fontSize: 12,
                                textTransform: "capitalize",
                                transition: "all 0.15s",
                            }}
                        >
                            {mode === "orbit" ? "🔄 Orbit" : "⬆ Top Down"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room list */}
            <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    Rooms
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {scene?.rooms.map((room) => (
                        <RoomListItem
                            key={room.id}
                            room={room}
                            selected={selectedRoom === room.id}
                            onClick={() => setSelectedRoom(selectedRoom === room.id ? null : room.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Selected room details */}
            {selected && <RoomDetail room={selected} />}
        </aside>
    );
}

function RoomListItem({ room, selected, onClick }: { room: VRRoom; selected: boolean; onClick: () => void }) {
    const categoryColors: Record<string, string> = {
        public: "#6c63ff", private: "#ff6b9d", service: "#63ffaa",
    };
    const dot = categoryColors[room.category] ?? "#999";

    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${selected ? "#6c63ff" : "rgba(255,255,255,0.06)"}`,
                background: selected ? "rgba(108,99,255,0.15)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
        >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#c4bfff" : "#ddd" }}>
                    {room.name}
                </div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                    {room.furniture.length} furniture items
                </div>
            </div>
        </button>
    );
}

function RoomDetail({ room }: { room: VRRoom }) {
    const [w, h, d] = room.size;
    const area = (w * d).toFixed(1);

    return (
        <div
            style={{
                padding: "14px 16px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(108,99,255,0.06)",
            }}
        >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4bfff", marginBottom: 10 }}>
                {room.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                    { label: "Width", value: `${w.toFixed(1)} m` },
                    { label: "Depth", value: `${d.toFixed(1)} m` },
                    { label: "Height", value: `${h.toFixed(1)} m` },
                    { label: "Area", value: `${area} m²` },
                ].map(({ label, value }) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginTop: 2 }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                {room.furniture.length} furniture · {room.category}
            </div>
        </div>
    );
}
