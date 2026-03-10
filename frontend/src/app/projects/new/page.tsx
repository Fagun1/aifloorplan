"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
    createProject,
    setPlot,
    getToken,
    type RoomReqIn,
} from "@/lib/apiClient";

// ── Dynamic import to avoid SSR canvas error ──────────────────
const PlotCanvas = dynamic(() => import("@/components/plot/PlotCanvas"), { ssr: false });

// ── Room templates ────────────────────────────────────────────
const ROOM_COLORS: Record<string, string> = {
    public: "#6c63ff",
    private: "#48c9b0",
    service: "#f5c842",
};

const ROOM_TEMPLATES = [
    { name: "Living Room", category: "public", target_area_sqm: 20 },
    { name: "Master Bedroom", category: "private", target_area_sqm: 16 },
    { name: "Bedroom", category: "private", target_area_sqm: 12 },
    { name: "Kitchen", category: "service", target_area_sqm: 10 },
    { name: "Bathroom", category: "service", target_area_sqm: 5 },
    { name: "Dining", category: "public", target_area_sqm: 10 },
    { name: "Study", category: "private", target_area_sqm: 8 },
];

type Step = 1 | 2 | 3;

export default function NewProjectPage() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1
    const [name, setName] = useState("My House Project");
    const [numFloors, setNumFloors] = useState(1);
    const [gateDirection, setGateDirection] = useState("south");
    const [seed, setSeed] = useState(42);

    // Step 2
    const [vertices, setVertices] = useState<[number, number][]>([]);
    const [setbackM, setSetbackM] = useState(1.0);

    // Step 3
    const [rooms, setRooms] = useState<RoomReqIn[]>([
        { name: "Living Room", category: "public", target_area_sqm: 20 },
        { name: "Master Bedroom", category: "private", target_area_sqm: 16 },
        { name: "Kitchen", category: "service", target_area_sqm: 10 },
        { name: "Bathroom", category: "service", target_area_sqm: 5 },
    ]);

    useEffect(() => {
        if (!token) router.push("/auth");
    }, [token]);

    // ── Room helpers ───────────────────────────────────────────
    function addRoom(template?: typeof ROOM_TEMPLATES[0]) {
        setRooms(r => [...r, template ?? { name: "New Room", category: "private", target_area_sqm: 10 }]);
    }

    function updateRoom(index: number, key: keyof RoomReqIn, val: string | number) {
        setRooms(r => r.map((room, i) => i === index ? { ...room, [key]: val } : room));
    }

    function removeRoom(index: number) {
        setRooms(r => r.filter((_, i) => i !== index));
    }

    // ── Submit ─────────────────────────────────────────────────
    async function handleSubmit() {
        if (rooms.length === 0) { setError("Add at least one room."); return; }
        setError(null);
        setSubmitting(true);
        try {
            // Step 1: Create project with room requirements
            const project = await createProject({
                name,
                num_floors: numFloors,
                gate_direction: gateDirection,
                generation_seed: seed,
                rooms,
            });

            // Step 2: Save plot (use drawn vertices or 20×15m default)
            const plotVerts: [number, number][] = vertices.length >= 3 ? vertices : [
                [0, 0], [20, 0], [20, 15], [0, 15],
            ];

            await setPlot(project.id, {
                vertices: plotVerts,
                setback_m: setbackM,
                gate_direction: gateDirection,
            });

            // Step 3: Generate + persist layouts via the project-level endpoint
            // (reads rooms from DB with correct field names, bypasses Q&A wizard)
            const token = getToken();
            const genResp = await fetch(`/api/v1/projects/${project.id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            });
            if (!genResp.ok) {
                const errData = await genResp.json().catch(() => ({}));
                const detail = errData?.detail;
                const msg = Array.isArray(detail)
                    ? detail.map((e: any) => e.msg).join("; ")
                    : (typeof detail === "string" ? detail : `Generation failed (${genResp.status})`);
                throw new Error(msg);
            }

            // Navigate to project page (layouts are already in DB)
            router.push(`/projects/${project.id}`);
        } catch (e: any) {
            setError(e.message ?? "An unexpected error occurred.");
            setSubmitting(false);
        }
    }

    const steps = ["Project Setup", "Draw Plot", "Room Requirements"];

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "40px 24px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                {/* Back */}
                <button className="btn btn-secondary btn-sm" style={{ marginBottom: 32 }} onClick={() => router.push("/dashboard")}>
                    ← Back to Dashboard
                </button>

                {/* Step indicator */}
                <div className="step-indicator" style={{ marginBottom: 40 }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
                            <div className={`step-dot ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}>
                                {step > i + 1 ? "✓" : i + 1}
                            </div>
                            {i < steps.length - 1 && <div className="step-line" />}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: "32px" }}>

                    {/* ═══ STEP 1 ═══ */}
                    {step === 1 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: 6 }}>Project Setup</h2>
                            <p className="text-secondary" style={{ marginBottom: 28 }}>Basic project information</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label className="input-label">Project Name</label>
                                    <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="My Dream House" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label className="input-label">Number of Floors</label>
                                        <select className="select" value={numFloors} onChange={e => setNumFloors(+e.target.value)}>
                                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Floor{n > 1 ? "s" : ""}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Gate Direction</label>
                                        <select className="select" value={gateDirection} onChange={e => setGateDirection(e.target.value)}>
                                            <option value="north">North ↑</option>
                                            <option value="south">South ↓</option>
                                            <option value="east">East →</option>
                                            <option value="west">West ←</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Generation Seed</label>
                                    <input className="input" type="number" value={seed} onChange={e => setSeed(+e.target.value)} />
                                    <p className="text-muted text-sm" style={{ marginTop: 4 }}>Same seed = reproducible layouts</p>
                                </div>
                            </div>
                            <div className="flex justify-between" style={{ marginTop: 32 }}>
                                <div />
                                <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!name.trim()}>
                                    Next: Draw Plot →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 2 ═══ */}
                    {step === 2 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: 6 }}>Draw Your Plot</h2>
                            <p className="text-secondary" style={{ marginBottom: 8 }}>Click to place vertices. Each cell = 1 m.</p>
                            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                                {vertices.length >= 3
                                    ? `Area ≈ ${polygonArea(vertices).toFixed(1)} m²`
                                    : "Need at least 3 points (or skip to use 20×15 m default)"}
                            </p>

                            <div style={{ marginBottom: 16 }}>
                                <label className="input-label">Setback Distance: <strong style={{ color: "var(--brand-primary)" }}>{setbackM} m</strong></label>
                                <input type="range" min={0.5} max={5} step={0.5} value={setbackM}
                                    onChange={e => setSetbackM(+e.target.value)} style={{ width: "100%" }} />
                            </div>

                            {/* dynamically loaded canvas */}
                            <PlotCanvas vertices={vertices} onVerticesChange={setVertices} />

                            <div className="flex gap-2" style={{ marginTop: 12 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setVertices(v => v.slice(0, -1))}>Undo</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setVertices([])}>Clear</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setVertices([[0, 0], [20, 0], [20, 15], [0, 15]])}>20×15 m</button>
                            </div>

                            <div className="flex justify-between" style={{ marginTop: 28 }}>
                                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Rooms →</button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 3 ═══ */}
                    {step === 3 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: 6 }}>Room Requirements</h2>
                            <p className="text-secondary" style={{ marginBottom: 24 }}>Specify what rooms you need and their sizes</p>

                            <div style={{ marginBottom: 20 }}>
                                <p className="input-label" style={{ marginBottom: 8 }}>Quick Add</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {ROOM_TEMPLATES.map(t => (
                                        <button key={t.name} className="btn btn-secondary btn-sm" onClick={() => addRoom(t)}
                                            style={{ borderColor: ROOM_COLORS[t.category] + "60", color: ROOM_COLORS[t.category] }}>
                                            + {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                                {rooms.map((room, i) => (
                                    <div key={i} className="flex items-center gap-3" style={{
                                        background: "var(--bg-glass)", border: "1px solid var(--border-subtle)",
                                        borderRadius: "var(--radius-md)", padding: "10px 14px",
                                        borderLeft: `3px solid ${ROOM_COLORS[room.category] || "var(--brand-primary)"}`,
                                    }}>
                                        <input className="input" value={room.name} onChange={e => updateRoom(i, "name", e.target.value)}
                                            style={{ flex: 2, background: "transparent", border: "none", padding: 0 }} />
                                        <select className="select" value={room.category} onChange={e => updateRoom(i, "category", e.target.value)} style={{ flex: 1 }}>
                                            <option value="public">Public</option>
                                            <option value="private">Private</option>
                                            <option value="service">Service</option>
                                        </select>
                                        <input className="input" type="number" min={3} max={100} step={0.5}
                                            value={room.target_area_sqm} onChange={e => updateRoom(i, "target_area_sqm", +e.target.value)}
                                            style={{ width: 80, flex: "none" }} />
                                        <span className="text-muted text-sm" style={{ flex: "none" }}>m²</span>
                                        <button className="btn btn-danger btn-sm" onClick={() => removeRoom(i)} style={{ flex: "none" }}>✕</button>
                                    </div>
                                ))}
                            </div>

                            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => addRoom()}>
                                + Add Custom Room
                            </button>

                            <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-glass)", borderRadius: "var(--radius-md)" }}>
                                {(() => {
                                    const totalRooms = rooms.reduce((s, r) => s + r.target_area_sqm, 0);
                                    const plotArea = polygonArea(vertices.length >= 3 ? vertices : [[0, 0], [20, 0], [20, 15], [0, 15]]);
                                    // Estimate buildable as 85% of plot (rough setback approximation)
                                    const buildable = Math.max(plotArea * 0.85 - 4 * setbackM * setbackM, plotArea * 0.5);
                                    const ratio = buildable > 0 ? (totalRooms / buildable) : 0;
                                    const pct = Math.min(ratio * 100, 100).toFixed(0);
                                    const tooSmall = ratio < 0.15;
                                    const tooBig = ratio > 1.0;
                                    return (
                                        <>
                                            <div className="flex justify-between" style={{ marginBottom: 8 }}>
                                                <span className="text-secondary">Total Required Area</span>
                                                <span className="font-bold" style={{ color: "var(--brand-primary)" }}>
                                                    {totalRooms.toFixed(1)} m²
                                                </span>
                                            </div>
                                            <div style={{ height: 6, background: "var(--border-subtle)", borderRadius: 3, overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 3,
                                                    width: `${pct}%`,
                                                    background: tooBig ? "var(--red)" : tooSmall ? "#f5c842" : "var(--brand-primary)",
                                                    transition: "width 0.3s"
                                                }} />
                                            </div>
                                            <div className="flex justify-between" style={{ marginTop: 4 }}>
                                                <span className="text-muted text-sm">Plot utilization</span>
                                                <span className="text-muted text-sm" style={{ color: tooBig ? "var(--red)" : tooSmall ? "#f5c842" : undefined }}>
                                                    {pct}% of ~{buildable.toFixed(0)} m² buildable
                                                </span>
                                            </div>
                                            {tooSmall && (
                                                <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.4)", borderRadius: "var(--radius-sm)", color: "#f5c842", fontSize: 12 }}>
                                                    ⚠ Rooms are much smaller than the plot. Add more rooms or your layout may fail.
                                                </div>
                                            )}
                                            {tooBig && (
                                                <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.4)", borderRadius: "var(--radius-sm)", color: "var(--red)", fontSize: 12 }}>
                                                    ✕ Total rooms exceed buildable area. Reduce room sizes.
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {error && (
                                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.3)", borderRadius: "var(--radius-md)", color: "var(--red)", fontSize: 13 }}>
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-between" style={{ marginTop: 28 }}>
                                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                                <button className="btn btn-success" onClick={handleSubmit} disabled={submitting || rooms.length === 0}>
                                    {submitting ? <><span className="spinner" /> Generating Layouts...</> : "🚀 Generate Layouts"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function polygonArea(verts: [number, number][]) {
    let area = 0;
    for (let i = 0; i < verts.length; i++) {
        const [x1, y1] = verts[i];
        const [x2, y2] = verts[(i + 1) % verts.length];
        area += (x1 * y2 - x2 * y1);
    }
    return Math.abs(area / 2);
}
