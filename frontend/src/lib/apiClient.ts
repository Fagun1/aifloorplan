import type {
  AnalyzeLayoutResponse,
  ExplainImprovementResponse,
  GenerateLayoutsRequest,
  GenerateLayoutsResponse,
  LayoutCandidate,
} from "@/lib/types";

export async function generateLayouts(
  req: GenerateLayoutsRequest,
): Promise<GenerateLayoutsResponse> {
  const resp = await fetch("/api/v1/layouts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Request failed (${resp.status})`);
  }

  return (await resp.json()) as GenerateLayoutsResponse;
}

export async function analyzeLayout(
  layout: LayoutCandidate,
  gate_direction: string,
): Promise<AnalyzeLayoutResponse> {
  const resp = await fetch("/api/v1/layouts/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout, gate_direction }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Request failed (${resp.status})`);
  }

  return (await resp.json()) as AnalyzeLayoutResponse;
}

export async function explainImprovement(
  original: LayoutCandidate,
  improved: LayoutCandidate,
  gate_direction: string,
): Promise<ExplainImprovementResponse> {
  const resp = await fetch("/api/v1/layouts/explain-improvement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original_layout: original, improved_layout: improved, gate_direction }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Request failed (${resp.status})`);
  }

  return (await resp.json()) as ExplainImprovementResponse;
}

