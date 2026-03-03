/**
 * Deterministic symbolic furniture placement from room polygon and name.
 * Matches Planner5D-style: rug, sofa, armchair, coffee table, kitchen appliances, bathroom fixtures, etc.
 */

import { polygonCentroid } from "@/lib/geometry";
import { FURNITURE } from "./constants";

export type FurniturePiece =
  | { type: "rect"; x: number; y: number; width: number; height: number; fill: string; cornerRadius?: number; opacity?: number }
  | { type: "circle"; x: number; y: number; radius: number; fill: string; opacity?: number };

function roomCategory(name: string, category: string): string {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes("living") || c === "public") return "living";
  if (n.includes("bed") || n.includes("bedroom") || c === "private") return "bedroom";
  if (n.includes("kitchen") || c === "service") return "kitchen";
  if (n.includes("bath") || n.includes("toilet") || n.includes("wc")) return "bathroom";
  if (n.includes("dining")) return "dining";
  return "default";
}

function roomScale(areaM2: number): number {
  const s = Math.sqrt(Math.max(4, areaM2)) / 4;
  return Math.min(1.2, Math.max(0.4, s));
}

export function getFurnitureForRoom(
  name: string,
  category: string,
  polygon: [number, number][],
  areaM2: number,
): FurniturePiece[] {
  const kind = roomCategory(name, category);
  const fill = FURNITURE[kind.toUpperCase() as keyof typeof FURNITURE] ?? FURNITURE.DEFAULT;
  const centroid = polygonCentroid(polygon);
  const scale = roomScale(areaM2);
  const pieces: FurniturePiece[] = [];

  const cx = centroid[0];
  const cy = centroid[1];

  if (kind === "living") {
    const w = 2.2 * scale;
    const h = 0.9 * scale;
    const rugW = w * 1.4;
    const rugH = h * 1.6;
    pieces.push({ type: "rect", x: cx - rugW / 2, y: cy - rugH / 2, width: rugW, height: rugH, fill: "#DBEAFE", opacity: 0.6 });
    pieces.push({ type: "rect", x: cx - w / 2, y: cy - h / 2, width: w, height: h, fill: "#94A3B8", cornerRadius: 14, opacity: 0.9 });
    pieces.push({ type: "circle", x: cx + 0.8 * scale, y: cy + 0.5 * scale, radius: 0.35 * scale, fill: "#9CA3AF" });
    const armW = 0.6 * scale;
    const armH = 0.7 * scale;
    pieces.push({ type: "rect", x: cx - w / 2 - armW - 0.2, y: cy - armH / 2, width: armW, height: armH, fill: "#94A3B8", cornerRadius: 14, opacity: 0.9 });
  } else if (kind === "bedroom") {
    const bedW = 1.8 * scale;
    const bedH = 1.2 * scale;
    pieces.push({ type: "rect", x: cx - bedW / 2, y: cy - bedH / 2, width: bedW, height: bedH, fill: "#D1D5DB" });
    const pillW = 0.5 * scale;
    const pillH = 0.35 * scale;
    pieces.push({ type: "rect", x: cx - bedW / 2 + 0.1, y: cy - bedH / 2 + 0.1, width: pillW, height: pillH, fill: "#F9FAFB" });
    pieces.push({ type: "rect", x: cx + bedW / 2 - 0.1 - pillW, y: cy - bedH / 2 + 0.1, width: pillW, height: pillH, fill: "#F9FAFB" });
    const sideW = 0.4 * scale;
    const sideH = 0.4 * scale;
    pieces.push({ type: "rect", x: cx - bedW / 2 - sideW - 0.15, y: cy - sideH / 2, width: sideW, height: sideH, fill: "#9CA3AF" });
    const deskW = 0.9 * scale;
    const deskH = 0.5 * scale;
    pieces.push({ type: "rect", x: cx + bedW / 2 + 0.15, y: cy - deskH / 2, width: deskW, height: deskH, fill: "#9CA3AF" });
    pieces.push({ type: "circle", x: cx + bedW / 2 + 0.15 + deskW * 0.25, y: cy + deskH / 2 + 0.15, radius: 0.12 * scale, fill: "#6B7280" });
  } else if (kind === "kitchen") {
    const counterLen = 1.8 * scale;
    const counterH = 0.4;
    pieces.push({
      type: "rect",
      x: cx - counterLen / 2,
      y: cy - counterH / 2,
      width: counterLen,
      height: counterH,
      fill: "#9CA3AF",
    });
    const appW = 0.4 * scale;
    const appH = 0.35 * scale;
    pieces.push({ type: "rect", x: cx - counterLen / 2 + 0.1, y: cy - appH / 2, width: appW, height: appH, fill: "#6B7280" });
    pieces.push({ type: "rect", x: cx - appW / 2, y: cy - appH / 2, width: appW, height: appH, fill: "#6B7280" });
    pieces.push({ type: "rect", x: cx + counterLen / 2 - appW - 0.1, y: cy - appH / 2, width: appW, height: appH, fill: "#6B7280" });
  } else if (kind === "bathroom") {
    const toiletW = 0.4 * scale;
    const toiletH = 0.5 * scale;
    pieces.push({ type: "rect", x: cx - toiletW / 2 - 0.4, y: cy - toiletH / 2, width: toiletW, height: toiletH, fill: "#9CA3AF" });
    const sinkW = 0.45 * scale;
    const sinkH = 0.35 * scale;
    pieces.push({ type: "rect", x: cx - sinkW / 2, y: cy - sinkH / 2, width: sinkW, height: sinkH, fill: "#CBD5E1" });
    const showerW = 0.6 * scale;
    const showerH = 0.5 * scale;
    pieces.push({ type: "rect", x: cx + 0.4, y: cy - showerH / 2, width: showerW, height: showerH, fill: "#94A3B8" });
  } else if (kind === "dining") {
    const tableW = 1.4 * scale;
    const tableH = 0.8 * scale;
    pieces.push({ type: "rect", x: cx - tableW / 2, y: cy - tableH / 2, width: tableW, height: tableH, fill: "#9CA3AF" });
    const chairW = 0.35 * scale;
    const chairH = 0.35 * scale;
    pieces.push({ type: "rect", x: cx - tableW / 2 - chairW - 0.05, y: cy - chairH / 2, width: chairW, height: chairH, fill: "#6B7280" });
    pieces.push({ type: "rect", x: cx + tableW / 2 + 0.05, y: cy - chairH / 2, width: chairW, height: chairH, fill: "#6B7280" });
  } else {
    const w = 0.8 * scale;
    const h = 0.5 * scale;
    pieces.push({ type: "rect", x: cx - w / 2, y: cy - h / 2, width: w, height: h, fill });
  }

  return pieces;
}
