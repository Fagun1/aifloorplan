/**
 * Expanded API client — covers auth, projects, plots, and layouts.
 * Uses relative URLs so all requests go through the Next.js rewrite proxy → no CORS.
 */

import type {
  AnalyzeLayoutResponse,
  ExplainImprovementResponse,
  GenerateLayoutsRequest,
  GenerateLayoutsResponse,
  ImproveLayoutRequest,
  ImproveLayoutResponse,
  LayoutCandidate,
} from "@/lib/types";

// Relative base — Next.js rewrites /api/v1/* → http://localhost:8000/api/v1/*
// This means NO CORS issues regardless of what DATABASE_URL is set to.
const API_BASE = "";

// ── Token helpers ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("auth_token");
}

// ── Base fetch ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!resp.ok) {
    let errorMsg = `Request failed (${resp.status})`;
    try {
      const data = await resp.json();
      const detail = data?.detail ?? data?.message;
      if (Array.isArray(detail)) {
        // Pydantic 422 validation errors: [{loc, msg, type}, ...]
        errorMsg = detail.map((e: any) => {
          const loc = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : "";
          return loc ? `${loc}: ${e.msg}` : e.msg;
        }).join("; ");
      } else if (typeof detail === "string") {
        errorMsg = detail;
      } else if (detail != null) {
        errorMsg = JSON.stringify(detail);
      }
    } catch {
      errorMsg = (await resp.text().catch(() => "")) || errorMsg;
    }
    throw new Error(errorMsg);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}


// ── Auth ──────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name?: string;
}

export async function register(email: string, password: string, full_name?: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ id: string; email: string; full_name?: string; subscription: string }> {
  return apiFetch("/api/v1/auth/me", {}, true);
}

// ── Projects ──────────────────────────────────────────────────────────────

export interface RoomReqIn {
  name: string;
  category: string;
  target_area_sqm: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  num_floors?: number;
  gate_direction?: string;
  road_adjacency?: string[];
  generation_seed?: number;
  rooms?: RoomReqIn[];
}

export interface ProjectOut {
  id: string;
  name: string;
  description?: string;
  status: string;
  num_floors: number;
  gate_direction: string;
  road_adjacency: string[];
  generation_seed: number;
  rooms: { id: string; name: string; category: string; target_area_sqm: number }[];
  layouts: { id: string; candidate_index: number; is_selected: boolean; total_score?: number; dimension_scores?: Record<string, number> }[];
  created_at: string;
  updated_at: string;
}

export async function createProject(data: ProjectCreate): Promise<ProjectOut> {
  return apiFetch<ProjectOut>("/api/v1/projects", { method: "POST", body: JSON.stringify(data) }, true);
}

export async function listProjects(): Promise<ProjectOut[]> {
  return apiFetch<ProjectOut[]>("/api/v1/projects", {}, true);
}

export async function getProject(id: string): Promise<ProjectOut> {
  return apiFetch<ProjectOut>(`/api/v1/projects/${id}`, {}, true);
}

export async function updateProject(id: string, data: Partial<ProjectCreate>): Promise<ProjectOut> {
  return apiFetch<ProjectOut>(`/api/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true);
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/projects/${id}`, { method: "DELETE" }, true);
}

// ── Plots ─────────────────────────────────────────────────────────────────

export interface PlotCreate {
  vertices: [number, number][];
  setback_m?: number;
  gate_direction?: string;
}

export interface PlotOut {
  id: string;
  project_id: string;
  vertices: [number, number][];
  area_sqm?: number;
  buildable_vertices?: [number, number][];
  buildable_area_sqm?: number;
  setback_m: number;
  is_valid: boolean;
  validation_issues: string[];
}

export async function setPlot(projectId: string, data: PlotCreate): Promise<PlotOut> {
  return apiFetch<PlotOut>(`/api/v1/projects/${projectId}/plot`, { method: "POST", body: JSON.stringify(data) }, true);
}

export async function getPlot(projectId: string): Promise<PlotOut> {
  return apiFetch<PlotOut>(`/api/v1/projects/${projectId}/plot`, {}, true);
}

// ── Layouts ───────────────────────────────────────────────────────────────

export async function generateLayouts(req: GenerateLayoutsRequest): Promise<GenerateLayoutsResponse> {
  return apiFetch<GenerateLayoutsResponse>("/api/v1/layouts/generate", {
    method: "POST",
    body: JSON.stringify(req),
  }, false);
}

export async function improveLayout(req: ImproveLayoutRequest): Promise<ImproveLayoutResponse> {
  return apiFetch<ImproveLayoutResponse>("/api/v1/layouts/improve", {
    method: "POST",
    body: JSON.stringify(req),
  }, false);
}

export async function analyzeLayout(layout: LayoutCandidate, gate_direction: string): Promise<AnalyzeLayoutResponse> {
  return apiFetch<AnalyzeLayoutResponse>("/api/v1/layouts/analyze", {
    method: "POST",
    body: JSON.stringify({ layout, gate_direction }),
  }, false);
}

export async function explainImprovement(
  original: LayoutCandidate,
  improved: LayoutCandidate,
  gate_direction: string,
): Promise<ExplainImprovementResponse> {
  return apiFetch<ExplainImprovementResponse>("/api/v1/layouts/explain-improvement", {
    method: "POST",
    body: JSON.stringify({ original_layout: original, improved_layout: improved, gate_direction }),
  }, false);
}
