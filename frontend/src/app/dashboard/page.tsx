"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { listProjects, deleteProject } from "@/lib/apiClient";
import type { ProjectOut } from "@/lib/apiClient";

export default function DashboardPage() {
    const router = useRouter();
    const { user, token, logout } = useAuthStore();
    const [projects, setProjects] = useState<ProjectOut[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) { router.push("/auth"); return; }
        loadProjects();
    }, [token]);

    async function loadProjects() {
        try {
            const list = await listProjects();
            setProjects(list);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this project?")) return;
        await deleteProject(id);
        setProjects(p => p.filter(x => x.id !== id));
    }

    const statusColor: Record<string, string> = {
        draft: "badge-yellow",
        layout_ready: "badge-green",
        generating: "badge-blue",
        editing: "badge-purple",
        exported: "badge-blue",
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
            {/* Top nav */}
            <header style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(13,13,20,0.9)",
                backdropFilter: "blur(20px)",
                position: "sticky",
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="flex items-center gap-3">
                        <div style={{ fontSize: 22 }}>🏛️</div>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>ArchPlan <span style={{ color: "var(--brand-primary)" }}>AI</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && <span className="text-secondary text-sm">{user.email}</span>}
                        <button className="btn btn-secondary btn-sm" onClick={() => { logout(); router.push("/auth"); }}>Sign Out</button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
                {/* Hero */}
                <div style={{ marginBottom: 40 }}>
                    <h1 style={{ fontSize: 32, marginBottom: 8 }}>
                        Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
                    </h1>
                    <p className="text-secondary">Manage your architectural projects</p>
                </div>

                {/* Project header row */}
                <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20 }}>Your Projects <span className="text-muted text-sm">({projects.length})</span></h2>
                    <Link href="/projects/new">
                        <button className="btn btn-primary">
                            <span>+</span> New Project
                        </button>
                    </Link>
                </div>

                {/* Project grid */}
                {loading ? (
                    <div className="flex items-center gap-3" style={{ padding: "40px 0" }}>
                        <span className="spinner" /> <span className="text-secondary">Loading projects...</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="card text-center" style={{ padding: "60px 24px" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
                        <h3 style={{ marginBottom: 8 }}>No projects yet</h3>
                        <p className="text-secondary" style={{ marginBottom: 24 }}>Draw your first plot and generate AI-optimized floor plans</p>
                        <Link href="/projects/new">
                            <button className="btn btn-primary">Create First Project</button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid-projects">
                        {projects.map(project => (
                            <div key={project.id} className="card fade-in" style={{ padding: "20px", cursor: "pointer" }}
                                onClick={() => router.push(`/projects/${project.id}`)}>
                                <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600 }} className="truncate">{project.name}</h3>
                                    <span className={`badge ${statusColor[project.status] ?? "badge-yellow"}`}>{project.status.replace("_", " ")}</span>
                                </div>

                                {/* Stats row */}
                                <div className="flex gap-4" style={{ marginBottom: 16 }}>
                                    <StatPill icon="🏠" label="Rooms" value={project.rooms.length} />
                                    <StatPill icon="🏢" label="Floors" value={project.num_floors} />
                                    <StatPill icon="📐" label="Layouts" value={project.layouts.length} />
                                </div>

                                {/* Best score */}
                                {project.layouts.length > 0 && (() => {
                                    const best = project.layouts.reduce((mx, l) => (l.total_score ?? 0) > (mx.total_score ?? 0) ? l : mx, project.layouts[0]);
                                    const score = best.total_score ?? 0;
                                    return (
                                        <div>
                                            <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                                                <span className="text-muted">Best score</span>
                                                <span className="font-bold" style={{ color: "var(--green)" }}>{score.toFixed(1)}</span>
                                            </div>
                                            <div className="score-bar"><div className="score-bar-fill" style={{ width: `${score}%` }} /></div>
                                        </div>
                                    );
                                })()}

                                {/* Actions */}
                                <div className="flex gap-2" style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
                                    <Link href={`/projects/${project.id}`} style={{ flex: 1 }}>
                                        <button className="btn btn-primary btn-sm" style={{ width: "100%" }}>Open</button>
                                    </Link>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>🗑</button>
                                </div>

                                <p className="text-muted text-sm" style={{ marginTop: 10 }}>
                                    {new Date(project.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{icon} {label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
        </div>
    );
}
