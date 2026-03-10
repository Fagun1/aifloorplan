"use client";
/**
 * Project Detail Page — shows 2D floor plan preview, candidates, score radar,
 * and links to the studio editor and VR walkthrough.
 */
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getProject, getToken, type ProjectOut } from "@/lib/apiClient";
import ScoreRadar from "@/components/scoring/ScoreRadar";
import QuestionWizard from "@/components/questions/QuestionWizard";
import FloorPlanCanvas from "@/components/floorplan/FloorPlanCanvas";

// ── Types ─────────────────────────────────────────────────────────────────

interface RoomPlacement {
    name: string;
    category: string;
    target_area: number;
    area_m2: number;
    centroid: [number, number];
    polygon: [number, number][];
}

interface FullLayout {
    id: string;
    candidate_index: number;
    is_selected: boolean;
    total_score?: number;
    dimension_scores?: Record<string, number>;
    candidate_data?: {
        rooms?: RoomPlacement[];
        plot_polygon?: [number, number][];
        buildable_polygon?: [number, number][];
        plot_bbox?: { min_x: number; min_y: number; max_x: number; max_y: number };
        buildable_bbox?: { min_x: number; min_y: number; max_x: number; max_y: number };
    };
}

// ── Room color palette ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
    public: { fill: "rgba(108,99,255,0.55)", stroke: "#6c63ff" },
    private: { fill: "rgba(72,201,176,0.55)", stroke: "#48c9b0" },
    service: { fill: "rgba(245,200,66,0.5)", stroke: "#f5c842" },
    other: { fill: "rgba(180,180,200,0.45)", stroke: "#aaaacc" },
};

// ── SVG floor plan renderer ───────────────────────────────────────────────

function FloorPlanSVG({ layout, size = 400 }: { layout: FullLayout; size?: number }) {
    const rooms = layout.candidate_data?.rooms ?? [];
    if (rooms.length === 0) {
        return (
            <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, color: "var(--text-muted)", fontSize: 13 }}>
                No floor plan data
            </div>
        );
    }

    // Compute bounding box from all room polygons
    const allPoints = rooms.flatMap(r => r.polygon ?? []);
    if (allPoints.length === 0) return null;

    const xs = allPoints.map(p => p[0]);
    const ys = allPoints.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;

    const pad = 20;
    const innerW = size - pad * 2;
    const innerH = size - pad * 2;
    const scale = Math.min(innerW / spanX, innerH / spanY);

    const toSVG = (x: number, y: number): [number, number] => [
        pad + (x - minX) * scale,
        size - pad - (y - minY) * scale,  // flip Y (SVG y-down, coords y-up)
    ];

    const polyPoints = (pts: [number, number][]) =>
        pts.map(p => toSVG(p[0], p[1]).join(",")).join(" ");

    return (
        <svg
            width={size} height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "block" }}
        >
            {/* Grid lines */}
            {Array.from({ length: 11 }).map((_, i) => {
                const x = pad + (i / 10) * innerW;
                const y = pad + (i / 10) * innerH;
                return (
                    <g key={i}>
                        <line x1={x} y1={pad} x2={x} y2={size - pad} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                        <line x1={pad} y1={y} x2={size - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                    </g>
                );
            })}

            {/* Room polygons */}
            {rooms.map((room, i) => {
                if (!room.polygon || room.polygon.length < 3) return null;
                const colors = CATEGORY_COLORS[room.category] ?? CATEGORY_COLORS.other;
                const [cx, cy] = toSVG(room.centroid?.[0] ?? 0, room.centroid?.[1] ?? 0);
                const areaLabel = room.area_m2 ? `${room.area_m2.toFixed(0)}m²` : "";

                return (
                    <g key={i}>
                        <polygon
                            points={polyPoints(room.polygon)}
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                        />
                        {/* Room name label */}
                        <text
                            x={cx} y={cy - 7}
                            textAnchor="middle"
                            fontSize={Math.max(9, Math.min(13, scale * 1.2))}
                            fill="rgba(255,255,255,0.9)"
                            fontWeight="600"
                            style={{ pointerEvents: "none" }}
                        >
                            {room.name.length > 12 ? room.name.slice(0, 11) + "…" : room.name}
                        </text>
                        {/* Area label */}
                        {areaLabel && (
                            <text
                                x={cx} y={cy + 10}
                                textAnchor="middle"
                                fontSize={Math.max(8, Math.min(11, scale))}
                                fill="rgba(255,255,255,0.55)"
                                style={{ pointerEvents: "none" }}
                            >
                                {areaLabel}
                            </text>
                        )}
                    </g>
                );
            })}

            {/* North arrow */}
            <text x={size - pad + 4} y={pad + 6} fontSize={10} fill="rgba(255,255,255,0.4)">N↑</text>

            {/* Scale bar */}
            <line x1={pad} y1={size - 6} x2={pad + scale * 5} y2={size - 6} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
            <text x={pad} y={size - 0} fontSize={9} fill="rgba(255,255,255,0.35)">5m</text>
        </svg>
    );
}

// ── Legend ─────────────────────────────────────────────────────────────────

function FPLegend() {
    return (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
            {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "other").map(([cat, c]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: c.fill, border: `2px solid ${c.stroke}` }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>{cat}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { token } = useAuthStore();
    const [project, setProject] = useState<ProjectOut | null>(null);
    const [fullLayouts, setFullLayouts] = useState<FullLayout[]>([]);
    const [selectedLayout, setSelectedLayout] = useState<FullLayout | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) { router.push("/auth"); return; }
        fetchProject();
    }, [token, id]);

    async function fetchProject() {
        try {
            const p = await getProject(id);
            setProject(p);
            await fetchLayouts();
        } catch { setError("Failed to load project"); }
        finally { setLoading(false); }
    }

    async function fetchLayouts() {
        try {
            const tok = getToken();
            const resp = await fetch(`/api/v1/projects/${id}/layouts`, {
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (resp.ok) {
                const data: FullLayout[] = await resp.json();
                setFullLayouts(data);
                if (data.length > 0) setSelectedLayout(data[0]);
            }
        } catch { /* layouts optional */ }
    }

    async function handleGenerate(userAnswers?: Record<string, any>) {
        if (!project) return;
        setGenerating(true); setError(null); setPendingQuestions([]);
        try {
            const tok = getToken();
            const genResp = await fetch(`/api/v1/projects/${id}/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (!genResp.ok) {
                const errData = await genResp.json().catch(() => ({}));
                const detail = errData?.detail;
                throw new Error(
                    Array.isArray(detail) ? detail.map((e: any) => e.msg).join("; ")
                        : (typeof detail === "string" ? detail : `Generation failed (${genResp.status})`)
                );
            }
            const result = await genResp.json();
            if (result.status === "pending_questions") {
                setPendingQuestions(result.pending_questions);
            } else {
                await fetchProject();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    }

    function handleAnswersSubmit(newAnswers: Record<string, any>) {
        const combined = { ...answers, ...newAnswers };
        setAnswers(combined);
        setPendingQuestions([]);
        handleGenerate(combined);
    }

    if (loading) return <FullPageLoader />;
    if (!project) return <div style={{ color: "var(--red)", padding: 40 }}>Project not found.</div>;

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
            {/* Header */}
            <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(13,13,20,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push("/dashboard")}>← Dashboard</button>
                    <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>{project.name}</h1>
                    <span className="badge badge-purple">{project.num_floors} Floor{project.num_floors > 1 ? "s" : ""}</span>
                    <span className="badge badge-blue">Gate: {project.gate_direction}</span>
                    <Link href={`/studio?project=${id}`}>
                        <button className="btn btn-primary btn-sm">✏️ Open Editor</button>
                    </Link>
                </div>
            </header>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>

                {/* Left sidebar — layout candidates */}
                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                        <h2 style={{ fontSize: 16 }}>Layout Candidates</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => handleGenerate()} disabled={generating}>
                            {generating ? <><span className="spinner" /> Generating</> : "⚡ Regenerate"}
                        </button>
                    </div>

                    {error && (
                        <div style={{ padding: "10px 14px", background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.3)", borderRadius: "var(--radius-md)", color: "var(--red)", fontSize: 13, marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    {pendingQuestions.length > 0 && (
                        <QuestionWizard questions={pendingQuestions} onSubmit={handleAnswersSubmit} />
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {fullLayouts.length === 0 && !generating && !pendingQuestions.length && (
                            <div className="card text-center" style={{ padding: "32px 16px" }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
                                <p className="text-secondary" style={{ marginBottom: 16 }}>No layouts generated yet</p>
                                <button className="btn btn-primary btn-sm" onClick={() => handleGenerate()}>Generate Now</button>
                            </div>
                        )}
                        {fullLayouts.map(layout => {
                            const score = layout.total_score ?? 0;
                            const isSelected = selectedLayout?.id === layout.id;
                            return (
                                <div
                                    key={layout.id}
                                    className="card"
                                    style={{
                                        padding: "10px 12px", cursor: "pointer",
                                        borderColor: isSelected ? "var(--brand-primary)" : undefined,
                                        boxShadow: isSelected ? "0 0 0 1px var(--brand-primary)" : undefined,
                                        transition: "all 0.15s",
                                    }}
                                    onClick={() => setSelectedLayout(layout)}
                                >
                                    <div className="flex justify-between items-center">
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>Layout #{layout.candidate_index + 1}</span>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: score >= 0.7 ? "var(--green)" : score >= 0.5 ? "var(--yellow)" : "var(--red)" }}>
                                            {(score * 100).toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="score-bar" style={{ marginTop: 6 }}>
                                        <div className="score-bar-fill" style={{ width: `${Math.min(score * 100, 100)}%` }} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                                        {layout.is_selected && <span className="badge badge-green" style={{ fontSize: 10 }}>Selected</span>}
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {layout.candidate_data?.rooms?.length ?? 0} rooms
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right panel — floor plan + scores */}
                <div>
                    {selectedLayout ? (
                        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                            {/* 2D Floor Plan */}
                            <div className="card" style={{ padding: 24 }}>
                                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                                    <div>
                                        <h2 style={{ marginBottom: 2 }}>Layout #{selectedLayout.candidate_index + 1} — Floor Plan</h2>
                                        <p className="text-secondary text-sm">
                                            {selectedLayout.candidate_data?.rooms?.length ?? 0} rooms ·{" "}
                                            {selectedLayout.candidate_data?.rooms?.reduce((s, r) => s + (r.area_m2 ?? r.target_area ?? 0), 0).toFixed(0)} m² total
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/vr/${id}`}>
                                            <button className="btn btn-sm" style={{ background: "linear-gradient(135deg, #1a0545, #2d1b69)", borderColor: "#6c63ff", color: "#c4bfff" }}>
                                                🥽 VR View
                                            </button>
                                        </Link>
                                        <Link href={`/studio?project=${id}`}>
                                            <button className="btn btn-primary btn-sm">✏️ Edit</button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Architectural floor plan with furniture */}
                                <FloorPlanCanvas
                                    rooms={selectedLayout.candidate_data?.rooms ?? []}
                                    size={500}
                                />
                                <p className="text-muted text-sm" style={{ marginTop: 8 }}>
                                    💡 Click any room to zoom in and see its furniture
                                </p>
                            </div>

                            {/* Score analysis */}
                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{ marginBottom: 4 }}>Score Analysis</h3>
                                <p className="text-secondary text-sm" style={{ marginBottom: 20 }}>Multi-objective architectural scoring</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
                                    <div>
                                        {selectedLayout.dimension_scores && (
                                            <ScoreRadar scores={selectedLayout.dimension_scores} size={260} />
                                        )}
                                    </div>
                                    <div>
                                        {selectedLayout.dimension_scores && Object.entries(selectedLayout.dimension_scores)
                                            .filter(([, val]) => typeof val === "number" || (typeof val === "string" && !isNaN(Number(val))))
                                            .map(([key, val]) => {
                                                const n = Number(val);
                                                return (
                                                    <div key={key} style={{ marginBottom: 12 }}>
                                                        <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                                                            <span style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                                                            <span style={{ fontWeight: 700, color: n >= 0.7 ? "var(--green)" : n >= 0.5 ? "var(--yellow)" : "var(--red)" }}>
                                                                {(n * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="score-bar">
                                                            <div className="score-bar-fill" style={{ width: `${Math.min(n * 100, 100).toFixed(1)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card text-center" style={{ padding: "80px 24px" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <p className="text-secondary">Select a layout candidate to see the floor plan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FullPageLoader() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
            <div className="flex flex-col items-center gap-4">
                <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                <p className="text-secondary">Loading project...</p>
            </div>
        </div>
    );
}
