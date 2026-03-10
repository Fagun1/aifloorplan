"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVRStore } from "@/store/vrStore";
import { VRSidebar } from "@/components/vr/VRSidebar";
import { useAuthStore } from "@/store/authStore";

// Dynamically import VRScene to avoid SSR issues with Three.js
const VRScene = dynamic(() => import("@/components/vr/VRScene").then((m) => m.VRScene), {
    ssr: false,
    loading: () => (
        <div
            style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 100%)",
                color: "#6c63ff", fontSize: 18, gap: 12,
            }}
        >
            <span style={{ animation: "spin 1s linear infinite" }}>⚙</span>
            Loading 3D Scene...
        </div>
    ),
});

export default function VRPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.id as string;
    const { token } = useAuthStore();
    const { scene, isLoading, error, fetchScene, activeFloor } = useVRStore();
    const [floor, setFloor] = useState(0);
    const [hydrated, setHydrated] = useState(false);

    // Wait for Zustand to rehydrate from localStorage before checking auth
    useEffect(() => {
        const t = setTimeout(() => setHydrated(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        // Fallback: read directly from localStorage if Zustand store not yet populated
        const effectiveToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
        if (!effectiveToken) { router.push("/auth"); return; }
        if (projectId) fetchScene(projectId, floor);
    }, [projectId, floor, token, hydrated]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                background: "#050510",
                overflow: "hidden",
                fontFamily: "var(--font-sans, system-ui, sans-serif)",
            }}
        >
            {/* Top bar */}
            <header
                style={{
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    gap: 16,
                    background: "rgba(10,10,20,0.95)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                    zIndex: 10,
                }}
            >
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: "6px 14px", borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#aaa", cursor: "pointer", fontSize: 13,
                    }}
                >
                    ← Back
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏠</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>ArchPlan VR</span>
                    <span
                        style={{
                            padding: "2px 8px", borderRadius: 99,
                            background: "rgba(108,99,255,0.25)",
                            color: "#a89fff", fontSize: 11, fontWeight: 600,
                        }}
                    >
                        3D Walkthrough
                    </span>
                </div>

                <div style={{ flex: 1 }} />

                {/* Floor selector */}
                {scene && scene.stats.room_count > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#666" }}>Floor:</span>
                        {[0, 1, 2].slice(0, Math.max(1, Math.ceil(scene.stats.room_count / 4))).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFloor(f)}
                                style={{
                                    width: 32, height: 28, borderRadius: 6,
                                    border: `1px solid ${floor === f ? "#6c63ff" : "rgba(255,255,255,0.1)"}`,
                                    background: floor === f ? "rgba(108,99,255,0.25)" : "rgba(255,255,255,0.04)",
                                    color: floor === f ? "#c4bfff" : "#777",
                                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                                }}
                            >
                                {f + 1}
                            </button>
                        ))}
                    </div>
                )}

                {/* Stats pill */}
                {scene && (
                    <div
                        style={{
                            padding: "4px 12px", borderRadius: 99,
                            background: "rgba(255,255,255,0.05)",
                            color: "#888", fontSize: 12,
                        }}
                    >
                        {scene.stats.furniture_count} objects
                    </div>
                )}
            </header>

            {/* Main content */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* 3D Canvas area */}
                <div style={{ flex: 1, position: "relative" }}>
                    {isLoading && (
                        <div
                            style={{
                                position: "absolute", inset: 0, zIndex: 5,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(5,5,16,0.85)", gap: 12,
                                color: "#6c63ff", fontSize: 16,
                            }}
                        >
                            <span>⟳</span> Generating scene…
                        </div>
                    )}
                    {error && (
                        <div
                            style={{
                                position: "absolute", inset: 0, zIndex: 5,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                background: "rgba(5,5,16,0.95)",
                                color: "#ff6b9d",
                            }}
                        >
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Scene Error</div>
                            <div style={{ fontSize: 14, color: "#888", maxWidth: 400, textAlign: "center" }}>{error}</div>
                            <button
                                onClick={() => fetchScene(projectId, floor)}
                                style={{
                                    marginTop: 24, padding: "10px 24px", borderRadius: 10,
                                    background: "#6c63ff", color: "#fff", border: "none",
                                    cursor: "pointer", fontSize: 14, fontWeight: 600,
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!isLoading && !error && <VRScene />}
                </div>

                {/* Sidebar */}
                {scene && <VRSidebar />}
            </div>

            {/* Controls hint bar */}
            <div
                style={{
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 24,
                    background: "rgba(10,10,20,0.8)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    color: "#444",
                    fontSize: 11,
                    flexShrink: 0,
                }}
            >
                {[
                    "🖱 Left drag — Orbit",
                    "🖱 Right drag — Pan",
                    "🖱 Scroll — Zoom",
                    "🖱 Click room — Inspect",
                ].map((hint) => (
                    <span key={hint}>{hint}</span>
                ))}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
