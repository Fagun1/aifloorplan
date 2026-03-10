"use client";
/**
 * FloorPlanCanvas — Premium architectural visualizer-style floor plan.
 *
 * Inspired by professional tools like Planner5D / Homebyme visualizer mode.
 * - Rich colored room fills with realistic floor textures
 * - Detailed furniture with proper proportions, shadows
 * - Door swing arcs, window triple-lines
 * - Rugs, plants, decorative elements
 * - Click-to-zoom with enlarged furniture in accent colors
 * - Hover highlights with glow effect
 */

import { useState, useMemo, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RoomData {
    name: string;
    category: string;
    target_area: number;
    area_m2: number;
    centroid: [number, number];
    polygon: [number, number][];
}

interface Props {
    rooms: RoomData[];
    size?: number;
}

// ── Color System ───────────────────────────────────────────────────────────

const C = {
    wall: "#1a1a1a",
    wallInner: "#333",
    outerWall: 5,
    innerWall: 3,
    bg: "#FEFCF8",
    // Room fills by type
    living: { floor: "#F5E6C8", floor2: "#EDD9B5", rug: "#C8956C", accent: "#9E7B4F", text: "#5C3D1E", furniture: "#8B6545", furnSel: "#6B3A1A" },
    bedroom: { floor: "#DCE8F5", floor2: "#C8D9EF", rug: "#A0B8D0", accent: "#5B89AE", text: "#2A4A6B", furniture: "#6E96B8", furnSel: "#2D6FA0" },
    kitchen: { floor: "#E8E4DF", floor2: "#DDD8D2", rug: "#C5BFB6", accent: "#8A8279", text: "#3E3933", furniture: "#7A7368", furnSel: "#4A3F32" },
    bathroom: { floor: "#E0E8EC", floor2: "#D2DCE2", rug: "#B0C4CE", accent: "#6B8D9E", text: "#2C4654", furniture: "#5A8090", furnSel: "#2A5A70" },
    dining: { floor: "#F2E8D5", floor2: "#E8DBC5", rug: "#D4B896", accent: "#A08050", text: "#5C4020", furniture: "#8A6840", furnSel: "#6A4820" },
    study: { floor: "#E5E0D8", floor2: "#D8D2C8", rug: "#B8AFA0", accent: "#7A7060", text: "#3A3428", furniture: "#6A6050", furnSel: "#4A4030" },
    default: { floor: "#F0EDE8", floor2: "#E4E0DA", rug: "#C8C4BC", accent: "#888078", text: "#444038", furniture: "#787068", furnSel: "#585048" },
};

function getTheme(name: string, cat: string) {
    const n = name.toLowerCase();
    if (n.includes("living") || n.includes("lounge") || n.includes("hall")) return C.living;
    if (n.includes("bed") || n.includes("master") || n.includes("guest")) return C.bedroom;
    if (n.includes("kitchen") || n.includes("pantry")) return C.kitchen;
    if (n.includes("bath") || n.includes("toilet") || n.includes("wc") || n.includes("wash")) return C.bathroom;
    if (n.includes("dining")) return C.dining;
    if (n.includes("study") || n.includes("office") || n.includes("work")) return C.study;
    if (cat === "private") return C.bedroom;
    if (cat === "public") return C.living;
    if (cat === "service") return C.kitchen;
    return C.default;
}

// ── SVG Defs (patterns, filters, gradients) ────────────────────────────────

function Defs() {
    return (
        <defs>
            {/* Wood plank pattern */}
            <pattern id="wood" width="20" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
                <rect width="20" height="8" fill="transparent" />
                <line x1="0" y1="8" x2="20" y2="8" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
                <line x1="10" y1="0" x2="10" y2="4" stroke="rgba(0,0,0,0.03)" strokeWidth="0.3" />
            </pattern>
            {/* Tile pattern */}
            <pattern id="tile" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="transparent" />
                <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.4" />
            </pattern>
            {/* Small tile for bathroom */}
            <pattern id="smalltile" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="transparent" />
                <rect x="0.3" y="0.3" width="5.4" height="5.4" rx="0.3" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            </pattern>
            {/* Drop shadow */}
            <filter id="fShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0.8" dy="0.8" stdDeviation="1.5" floodColor="#000" floodOpacity="0.15" />
            </filter>
            {/* Glow */}
            <filter id="fGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Rug weave */}
            <pattern id="rugweave" width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="transparent" />
                <line x1="0" y1="2" x2="4" y2="2" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="2" y1="0" x2="2" y2="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
            </pattern>
        </defs>
    );
}

// ── Furniture Components ───────────────────────────────────────────────────

interface FP { x: number; y: number; w: number; h: number; c: string; hi: boolean; }

function BedRoom({ x, y, w, h, c, hi }: FP) {
    const m = w * 0.06;
    const bw = w * 0.62, bh = h * 0.75;
    const bx = x + w * 0.22, by = y + h * 0.08;
    const o = hi ? 1 : 0.85;
    return (
        <g opacity={o}>
            {/* Rug under bed */}
            <rect x={bx - w * 0.08} y={by + bh * 0.1} width={bw + w * 0.16} height={bh * 0.85} rx={4} fill={c} opacity={0.12} />
            <rect x={bx - w * 0.08} y={by + bh * 0.1} width={bw + w * 0.16} height={bh * 0.85} rx={4} fill="url(#rugweave)" />
            {/* Bed frame */}
            <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="#FFF8F0" stroke={c} strokeWidth={1.4} filter="url(#fShadow)" />
            {/* Headboard */}
            <rect x={bx} y={by} width={bw} height={bh * 0.09} rx={2} fill={c} opacity={0.8} />
            {/* Pillows */}
            <rect x={bx + bw * 0.06} y={by + bh * 0.12} width={bw * 0.38} height={bh * 0.16} rx={5} fill="#FFF" stroke={c} strokeWidth={0.5} opacity={0.9} />
            <rect x={bx + bw * 0.56} y={by + bh * 0.12} width={bw * 0.38} height={bh * 0.16} rx={5} fill="#FFF" stroke={c} strokeWidth={0.5} opacity={0.9} />
            {/* Duvet */}
            <rect x={bx + bw * 0.04} y={by + bh * 0.32} width={bw * 0.92} height={bh * 0.62} rx={4} fill={c} opacity={0.18} />
            <line x1={bx + bw * 0.04} y1={by + bh * 0.52} x2={bx + bw * 0.96} y2={by + bh * 0.52} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Nightstand left */}
            <rect x={bx - w * 0.1} y={by + bh * 0.0} width={w * 0.08} height={w * 0.08} rx={1} fill="#FFF5EB" stroke={c} strokeWidth={0.8} filter="url(#fShadow)" />
            <circle cx={bx - w * 0.06} cy={by + bh * 0.0 + w * 0.04} r={1.5} fill={c} opacity={0.6} />
            {/* Nightstand right */}
            <rect x={bx + bw + w * 0.02} y={by + bh * 0.0} width={w * 0.08} height={w * 0.08} rx={1} fill="#FFF5EB" stroke={c} strokeWidth={0.8} filter="url(#fShadow)" />
            <circle cx={bx + bw + w * 0.06} cy={by + bh * 0.0 + w * 0.04} r={1.5} fill={c} opacity={0.6} />
            {/* Wardrobe */}
            <rect x={x + w * 0.02} y={by} width={w * 0.14} height={bh * 0.55} rx={2} fill={c} opacity={0.15} stroke={c} strokeWidth={0.7} />
            <line x1={x + w * 0.09} y1={by} x2={x + w * 0.09} y2={by + bh * 0.55} stroke={c} strokeWidth={0.4} />
        </g>
    );
}

function LivingRoom({ x, y, w, h, c, hi }: FP) {
    const o = hi ? 1 : 0.85;
    const sw = w * 0.65, sh = h * 0.2;
    const sx = x + w * 0.18, sy = y + h * 0.48;
    return (
        <g opacity={o}>
            {/* Area rug */}
            <rect x={x + w * 0.1} y={y + h * 0.12} width={w * 0.8} height={h * 0.75} rx={5} fill={c} opacity={0.14} />
            <rect x={x + w * 0.12} y={y + h * 0.14} width={w * 0.76} height={h * 0.71} rx={4} fill={c} opacity={0.08} stroke={c} strokeWidth={0.5} strokeDasharray="0" />
            <rect x={x + w * 0.1} y={y + h * 0.12} width={w * 0.8} height={h * 0.75} rx={5} fill="url(#rugweave)" />
            {/* TV unit */}
            <rect x={sx + sw * 0.05} y={y + h * 0.06} width={sw * 0.9} height={h * 0.06} rx={2} fill={c} opacity={0.25} stroke={c} strokeWidth={0.6} filter="url(#fShadow)" />
            {/* TV screen */}
            <rect x={sx + sw * 0.15} y={y + h * 0.01} width={sw * 0.7} height={h * 0.04} rx={1} fill="#222" opacity={0.6} />
            {/* Sofa */}
            <rect x={sx} y={sy} width={sw} height={sh} rx={5} fill="#F5EDE0" stroke={c} strokeWidth={1.2} filter="url(#fShadow)" />
            <rect x={sx + sw * 0.02} y={sy + sh * 0.45} width={sw * 0.96} height={sh * 0.5} rx={3} fill={c} opacity={0.15} />
            <rect x={sx} y={sy} width={sw * 0.05} height={sh} rx={3} fill={c} opacity={0.3} />
            <rect x={sx + sw * 0.95} y={sy} width={sw * 0.05} height={sh} rx={3} fill={c} opacity={0.3} />
            {/* Cushion dividers */}
            <line x1={sx + sw * 0.33} y1={sy + sh * 0.2} x2={sx + sw * 0.33} y2={sy + sh * 0.9} stroke={c} strokeWidth={0.5} opacity={0.3} />
            <line x1={sx + sw * 0.66} y1={sy + sh * 0.2} x2={sx + sw * 0.66} y2={sy + sh * 0.9} stroke={c} strokeWidth={0.5} opacity={0.3} />
            {/* Coffee table */}
            <rect x={sx + sw * 0.2} y={sy - h * 0.16} width={sw * 0.6} height={h * 0.1} rx={3} fill="#FFF8EE" stroke={c} strokeWidth={0.8} filter="url(#fShadow)" />
            {/* Items on coffee table */}
            <ellipse cx={sx + sw * 0.35} cy={sy - h * 0.11} rx={sw * 0.06} ry={h * 0.02} fill={c} opacity={0.2} />
            <rect x={sx + sw * 0.55} y={sy - h * 0.14} width={sw * 0.12} height={h * 0.04} rx={1} fill={c} opacity={0.15} />
            {/* Side chair */}
            <rect x={x + w * 0.02} y={sy - h * 0.06} width={w * 0.12} height={w * 0.12} rx={3} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            {/* Plant */}
            <circle cx={x + w * 0.9} cy={y + h * 0.1} r={w * 0.04} fill="#5D8A4E" opacity={0.6} />
            <circle cx={x + w * 0.92} cy={y + h * 0.08} r={w * 0.03} fill="#6B9E58" opacity={0.5} />
            <circle cx={x + w * 0.88} cy={y + h * 0.08} r={w * 0.025} fill="#7AB068" opacity={0.5} />
            <rect x={x + w * 0.885} y={y + h * 0.13} width={w * 0.03} height={w * 0.04} rx={1} fill="#8B6545" opacity={0.5} />
        </g>
    );
}

function DiningRoom({ x, y, w, h, c, hi }: FP) {
    const o = hi ? 1 : 0.85;
    const tw = w * 0.42, th = h * 0.38;
    const tx = x + (w - tw) / 2, ty = y + (h - th) / 2;
    const cs = Math.min(tw * 0.14, th * 0.16);
    return (
        <g opacity={o}>
            {/* Rug */}
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.42} ry={h * 0.42} fill={c} opacity={0.1} />
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.42} ry={h * 0.42} fill="url(#rugweave)" />
            {/* Table */}
            <rect x={tx} y={ty} width={tw} height={th} rx={3} fill="#FFF8EE" stroke={c} strokeWidth={1} filter="url(#fShadow)" />
            {/* Place settings */}
            {[0.2, 0.5, 0.8].map((r, i) => <circle key={`pt${i}`} cx={tx + tw * r} cy={ty + th * 0.25} r={cs * 0.35} fill="none" stroke={c} strokeWidth={0.4} opacity={0.4} />)}
            {[0.2, 0.5, 0.8].map((r, i) => <circle key={`pb${i}`} cx={tx + tw * r} cy={ty + th * 0.75} r={cs * 0.35} fill="none" stroke={c} strokeWidth={0.4} opacity={0.4} />)}
            {/* Centerpiece */}
            <ellipse cx={tx + tw / 2} cy={ty + th / 2} rx={tw * 0.08} ry={th * 0.1} fill="#5D8A4E" opacity={0.25} />
            {/* Chairs */}
            {[0.18, 0.5, 0.82].map((r, i) => (
                <g key={`ct${i}`}>
                    <rect x={tx + tw * r - cs / 2} y={ty - cs * 1.4} width={cs} height={cs} rx={cs * 0.25} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
                    <rect x={tx + tw * r - cs / 2} y={ty + th + cs * 0.4} width={cs} height={cs} rx={cs * 0.25} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
                </g>
            ))}
            <rect x={tx - cs * 1.4} y={ty + th * 0.5 - cs / 2} width={cs} height={cs} rx={cs * 0.25} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            <rect x={tx + tw + cs * 0.4} y={ty + th * 0.5 - cs / 2} width={cs} height={cs} rx={cs * 0.25} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            {/* Light fixture (circle on ceiling) */}
            <circle cx={tx + tw / 2} cy={ty + th / 2} r={tw * 0.15} fill="none" stroke={c} strokeWidth={0.3} opacity={0.2} strokeDasharray="2,2" />
        </g>
    );
}

function KitchenRoom({ x, y, w, h, c, hi }: FP) {
    const o = hi ? 1 : 0.85;
    return (
        <g opacity={o}>
            {/* L-shaped counter */}
            <rect x={x + w * 0.03} y={y + h * 0.03} width={w * 0.94} height={h * 0.2} rx={2} fill="#F0EBE5" stroke={c} strokeWidth={1} filter="url(#fShadow)" />
            <rect x={x + w * 0.03} y={y + h * 0.03} width={w * 0.14} height={h * 0.55} rx={2} fill="#F0EBE5" stroke={c} strokeWidth={1} filter="url(#fShadow)" />
            {/* Sink */}
            <rect x={x + w * 0.25} y={y + h * 0.06} width={w * 0.15} height={h * 0.12} rx={3} fill="#E8E4E0" stroke={c} strokeWidth={0.6} />
            <ellipse cx={x + w * 0.325} cy={y + h * 0.12} rx={w * 0.04} ry={h * 0.03} fill="#D5D0CA" />
            <circle cx={x + w * 0.325} cy={y + h * 0.055} r={1.5} fill="#888" />
            {/* Stove burners */}
            {[[0.55, 0.08], [0.65, 0.08], [0.55, 0.16], [0.65, 0.16]].map(([rx, ry], i) =>
                <circle key={i} cx={x + w * rx} cy={y + h * ry} r={h * 0.025} fill="none" stroke={c} strokeWidth={0.8} />
            )}
            {/* Oven knobs */}
            {[0.52, 0.56, 0.6, 0.64, 0.68].map((rx, i) =>
                <circle key={i} cx={x + w * rx} cy={y + h * 0.215} r={1} fill={c} opacity={0.5} />
            )}
            {/* Fridge */}
            <rect x={x + w * 0.78} y={y + h * 0.26} width={w * 0.18} height={h * 0.38} rx={2} fill="#E8E4E0" stroke={c} strokeWidth={0.9} filter="url(#fShadow)" />
            <line x1={x + w * 0.78} y1={y + h * 0.4} x2={x + w * 0.96} y2={y + h * 0.4} stroke={c} strokeWidth={0.5} />
            <circle cx={x + w * 0.94} cy={y + h * 0.34} r={1} fill={c} opacity={0.4} />
            <circle cx={x + w * 0.94} cy={y + h * 0.5} r={1} fill={c} opacity={0.4} />
            {/* Island / prep area */}
            <rect x={x + w * 0.3} y={y + h * 0.48} width={w * 0.4} height={h * 0.16} rx={2} fill="#FFF8F0" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            {/* Items on counter */}
            <rect x={x + w * 0.42} y={y + h * 0.07} width={w * 0.06} height={h * 0.1} rx={1} fill={c} opacity={0.12} />
        </g>
    );
}

function BathroomRoom({ x, y, w, h, c, hi }: FP) {
    const o = hi ? 1 : 0.85;
    return (
        <g opacity={o}>
            {/* Toilet */}
            <rect x={x + w * 0.05} y={y + h * 0.05} width={w * 0.22} height={h * 0.12} rx={2} fill="#FFF" stroke={c} strokeWidth={0.9} filter="url(#fShadow)" />
            <ellipse cx={x + w * 0.16} cy={y + h * 0.28} rx={w * 0.1} ry={h * 0.1} fill="#FFF" stroke={c} strokeWidth={0.9} filter="url(#fShadow)" />
            <ellipse cx={x + w * 0.16} cy={y + h * 0.26} rx={w * 0.06} ry={h * 0.06} fill="#E8F0F4" />
            {/* Vanity + basin */}
            <rect x={x + w * 0.5} y={y + h * 0.04} width={w * 0.28} height={h * 0.15} rx={2} fill="#F0EBE5" stroke={c} strokeWidth={0.8} filter="url(#fShadow)" />
            <ellipse cx={x + w * 0.64} cy={y + h * 0.1} rx={w * 0.06} ry={h * 0.04} fill="#E8F0F4" stroke={c} strokeWidth={0.5} />
            <circle cx={x + w * 0.64} cy={y + h * 0.05} r={1.2} fill="#888" />
            {/* Mirror */}
            <rect x={x + w * 0.52} y={y + h * 0.01} width={w * 0.24} height={h * 0.02} rx={0.5} fill="#B8D0E0" opacity={0.7} />
            {/* Shower/bathtub */}
            <rect x={x + w * 0.55} y={y + h * 0.5} width={w * 0.4} height={h * 0.45} rx={4} fill="#E8F0F4" stroke={c} strokeWidth={0.7} />
            <circle cx={x + w * 0.75} cy={y + h * 0.6} r={w * 0.04} fill="none" stroke={c} strokeWidth={0.5} />
            {/* Shower head */}
            <circle cx={x + w * 0.75} cy={y + h * 0.55} r={2} fill="#888" opacity={0.6} />
            {/* Bath mat */}
            <rect x={x + w * 0.55} y={y + h * 0.42} width={w * 0.2} height={h * 0.06} rx={1} fill={c} opacity={0.15} />
            {/* Door swing */}
            <path d={`M ${x + w * 0.06} ${y + h * 0.85} A ${w * 0.18} ${w * 0.18} 0 0 0 ${x + w * 0.24} ${y + h * 0.85}`}
                fill="none" stroke={c} strokeWidth={0.8} strokeDasharray="3,2" />
        </g>
    );
}

function StudyRoom({ x, y, w, h, c, hi }: FP) {
    const o = hi ? 1 : 0.85;
    return (
        <g opacity={o}>
            {/* Rug */}
            <rect x={x + w * 0.15} y={y + h * 0.2} width={w * 0.7} height={h * 0.6} rx={3} fill={c} opacity={0.08} />
            {/* Desk */}
            <rect x={x + w * 0.18} y={y + h * 0.3} width={w * 0.55} height={h * 0.18} rx={2} fill="#F5EDE0" stroke={c} strokeWidth={0.9} filter="url(#fShadow)" />
            {/* Monitor */}
            <rect x={x + w * 0.34} y={y + h * 0.2} width={w * 0.24} height={h * 0.08} rx={1} fill="#333" opacity={0.5} />
            <rect x={x + w * 0.44} y={y + h * 0.28} width={w * 0.04} height={h * 0.02} rx={0.5} fill="#666" opacity={0.4} />
            {/* Keyboard */}
            <rect x={x + w * 0.32} y={y + h * 0.35} width={w * 0.2} height={h * 0.04} rx={1} fill="#888" opacity={0.15} />
            {/* Chair */}
            <ellipse cx={x + w * 0.46} cy={y + h * 0.58} rx={w * 0.08} ry={h * 0.06} fill="#E8E0D5" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            <rect x={x + w * 0.41} y={y + h * 0.64} width={w * 0.1} height={h * 0.04} rx={4} fill="#D5CDC2" stroke={c} strokeWidth={0.4} />
            {/* Bookshelf */}
            <rect x={x + w * 0.02} y={y + h * 0.04} width={w * 0.12} height={h * 0.55} rx={1} fill="#F0E8D8" stroke={c} strokeWidth={0.7} filter="url(#fShadow)" />
            {[0.12, 0.25, 0.38, 0.48].map((ry, i) =>
                <g key={i}>
                    <line x1={x + w * 0.02} y1={y + h * ry} x2={x + w * 0.14} y2={y + h * ry} stroke={c} strokeWidth={0.4} />
                    <rect x={x + w * 0.03} y={y + h * (ry + 0.01)} width={w * 0.04} height={h * 0.06} rx={0.5} fill={c} opacity={0.2 + i * 0.05} />
                    <rect x={x + w * 0.08} y={y + h * (ry + 0.015)} width={w * 0.03} height={h * 0.05} rx={0.5} fill={c} opacity={0.15 + i * 0.04} />
                </g>
            )}
            {/* Plant */}
            <circle cx={x + w * 0.88} cy={y + h * 0.82} r={w * 0.04} fill="#5D8A4E" opacity={0.5} />
            <circle cx={x + w * 0.86} cy={y + h * 0.8} r={w * 0.03} fill="#6B9E58" opacity={0.4} />
            <rect x={x + w * 0.86} y={y + h * 0.85} width={w * 0.04} height={w * 0.045} rx={1} fill="#8B6545" opacity={0.5} />
        </g>
    );
}

function resolve(name: string, cat: string, fp: FP) {
    const n = name.toLowerCase();
    if (n.includes("bed") || n.includes("master") || n.includes("guest")) return <BedRoom {...fp} />;
    if (n.includes("living") || n.includes("lounge") || n.includes("hall")) return <LivingRoom {...fp} />;
    if (n.includes("dining")) return <DiningRoom {...fp} />;
    if (n.includes("kitchen") || n.includes("pantry")) return <KitchenRoom {...fp} />;
    if (n.includes("bath") || n.includes("toilet") || n.includes("wc") || n.includes("wash")) return <BathroomRoom {...fp} />;
    if (n.includes("study") || n.includes("office") || n.includes("work")) return <StudyRoom {...fp} />;
    if (cat === "private") return <BedRoom {...fp} />;
    if (cat === "public") return <LivingRoom {...fp} />;
    if (cat === "service") return <KitchenRoom {...fp} />;
    return null;
}

// ── Door Arc ───────────────────────────────────────────────────────────────

function Door({ cx, cy, r, side }: { cx: number; cy: number; r: number; side: "bl" | "br" | "tl" | "tr" }) {
    if (r < 4) return null;
    const rad = Math.min(r, 18);
    const angles: Record<string, [number, number, number, number]> = {
        bl: [cx, cy, cx + rad, cy - rad],
        br: [cx, cy, cx - rad, cy - rad],
        tl: [cx, cy, cx + rad, cy + rad],
        tr: [cx, cy, cx - rad, cy + rad],
    };
    const [x1, y1, x2, y2] = angles[side];
    return (
        <g opacity={0.55}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth={1} />
            <path d={`M ${x2} ${y2} A ${rad} ${rad} 0 0 ${side.startsWith("b") ? 1 : 0} ${x1 + (side.includes("l") ? rad : -rad)} ${y1}`}
                fill="none" stroke="#555" strokeWidth={0.7} />
        </g>
    );
}

// ── Window ─────────────────────────────────────────────────────────────────

function Window({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 20) return null;
    const nx = -dy / len, ny = dx / len;
    const s = 0.3, e = 0.7;
    const sx = x1 + dx * s, sy = y1 + dy * s;
    const ex = x1 + dx * e, ey = y1 + dy * e;
    return (
        <g opacity={0.6}>
            {/* Window glass (thicker blue line) */}
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#78B4D8" strokeWidth={3} />
            {/* Frame lines */}
            <line x1={sx + nx * 2.5} y1={sy + ny * 2.5} x2={ex + nx * 2.5} y2={ey + ny * 2.5} stroke="#555" strokeWidth={0.5} />
            <line x1={sx - nx * 2.5} y1={sy - ny * 2.5} x2={ex - nx * 2.5} y2={ey - ny * 2.5} stroke="#555" strokeWidth={0.5} />
            {/* Center mullion */}
            <line x1={(sx + ex) / 2 + nx * 3} y1={(sy + ey) / 2 + ny * 3} x2={(sx + ex) / 2 - nx * 3} y2={(sy + ey) / 2 - ny * 3} stroke="#555" strokeWidth={0.5} />
        </g>
    );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function FloorPlanCanvas({ rooms, size = 580 }: Props) {
    const [hover, setHover] = useState<number | null>(null);
    const [zoom, setZoom] = useState<number | null>(null);

    const bbox = useMemo(() => {
        const pts = rooms.flatMap(r => r.polygon ?? []);
        if (!pts.length) return { mx: 0, my: 0, sx: 1, sy: 1 };
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        return { mx: Math.min(...xs), my: Math.min(...ys), sx: Math.max(...xs) - Math.min(...xs) || 1, sy: Math.max(...ys) - Math.min(...ys) || 1 };
    }, [rooms]);

    const PAD = 50;
    const inner = size - PAD * 2;
    const sc = Math.min(inner / bbox.sx, inner / bbox.sy);

    const to = useCallback((x: number, y: number): [number, number] => [
        PAD + (x - bbox.mx) * sc,
        size - PAD - (y - bbox.my) * sc,
    ], [bbox, sc, size]);

    const pts = useCallback((p: [number, number][]) => p.map(v => to(v[0], v[1]).join(",")).join(" "), [to]);

    if (!rooms.length) {
        return (
            <div style={{
                width: size, height: size * 0.5, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #faf8f5 0%, #f0eee8 100%)", borderRadius: 16,
                border: "2px dashed #ccc", color: "#999", fontFamily: "'Segoe UI', system-ui", fontSize: 15
            }}>
                No floor plan data — click ⚡ Regenerate
            </div>
        );
    }

    // Outer boundary
    const allS = rooms.flatMap(r => (r.polygon ?? []).map(p => to(p[0], p[1])));
    const oxs = allS.map(p => p[0]), oys = allS.map(p => p[1]);
    const oX = Math.min(...oxs), oY = Math.min(...oys);
    const oW = Math.max(...oxs) - oX, oH = Math.max(...oys) - oY;

    // ── Zoom View ──────────────────────────────────────────────────────

    if (zoom !== null) {
        const room = rooms[zoom];
        if (!room?.polygon?.length) { setZoom(null); return null; }
        const theme = getTheme(room.name, room.category);
        const svgP = room.polygon.map(p => to(p[0], p[1]));
        const sxs = svgP.map(p => p[0]), sys = svgP.map(p => p[1]);
        const rx = Math.min(...sxs), ry = Math.min(...sys), rw = Math.max(...sxs) - rx, rh = Math.max(...sys) - ry;
        const zPad = 70;
        const zsc = Math.min((size - zPad * 2) / rw, (size - zPad * 2) / rh) * 0.82;
        const zox = zPad + ((size - zPad * 2) - rw * zsc) / 2 - rx * zsc;
        const zoy = zPad + ((size - zPad * 2) - rh * zsc) / 2 - ry * zsc;
        const zPts = room.polygon.map(p => { const s = to(p[0], p[1]); return `${s[0] * zsc + zox},${s[1] * zsc + zoy}`; }).join(" ");
        const [zcx, zcy] = (() => { const s = to(room.centroid[0], room.centroid[1]); return [s[0] * zsc + zox, s[1] * zsc + zoy]; })();
        const zrx = rx * zsc + zox, zry = ry * zsc + zoy, zrw = rw * zsc, zrh = rh * zsc;
        const area = room.area_m2 ?? room.target_area;
        const floorPat = (room.category === "service") ? "url(#smalltile)" : "url(#wood)";

        return (
            <div style={{ position: "relative" }}>
                <button onClick={() => setZoom(null)}
                    style={{
                        position: "absolute", top: 14, left: 14, zIndex: 10, padding: "8px 18px",
                        background: "linear-gradient(135deg, #1a1a2e, #2d2b55)", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        fontFamily: "'Segoe UI', system-ui", boxShadow: "0 3px 12px rgba(0,0,0,0.3)",
                        transition: "transform 0.15s"
                    }}>
                    ← All Rooms
                </button>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
                    style={{
                        borderRadius: 16, background: C.bg, display: "block",
                        border: `2px solid ${theme.accent}`, boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
                    }}>
                    <Defs />
                    {/* Room fill */}
                    <polygon points={zPts} fill={theme.floor} stroke={C.wall} strokeWidth={C.outerWall} strokeLinejoin="miter" />
                    <polygon points={zPts} fill={floorPat} />
                    {/* Furniture */}
                    {resolve(room.name, room.category, { x: zrx, y: zry, w: zrw, h: zrh, c: theme.furnSel, hi: true })}
                    {/* Labels */}
                    <text x={zcx} y={zcx > size / 2 ? 40 : size - 28} textAnchor="middle" fontSize={20} fontWeight="800"
                        fontFamily="'Segoe UI', system-ui" fill={theme.text} letterSpacing="1.5">
                        {room.name.toUpperCase()}
                    </text>
                    <text x={zcx} y={zcx > size / 2 ? 58 : size - 12} textAnchor="middle" fontSize={13}
                        fontFamily="'Segoe UI', system-ui" fill={theme.text} opacity={0.6}>
                        {area.toFixed(1)} m² · {room.category}
                    </text>
                    {/* Edge dimensions */}
                    {svgP.map((p, i) => {
                        const np = svgP[(i + 1) % svgP.length];
                        const edge = Math.sqrt((room.polygon[(i + 1) % room.polygon.length][0] - room.polygon[i][0]) ** 2 + (room.polygon[(i + 1) % room.polygon.length][1] - room.polygon[i][1]) ** 2);
                        const mx = (p[0] * zsc + zox + np[0] * zsc + zox) / 2;
                        const my = (p[1] * zsc + zoy + np[1] * zsc + zoy) / 2;
                        return (
                            <g key={i} opacity={0.5}>
                                <line x1={p[0] * zsc + zox} y1={p[1] * zsc + zoy} x2={np[0] * zsc + zox} y2={np[1] * zsc + zoy}
                                    stroke="#888" strokeWidth={0.5} strokeDasharray="4,3" />
                                <text x={mx} y={my - 5} textAnchor="middle" fontSize={10} fill="#666" fontFamily="'Segoe UI', system-ui"
                                    fontWeight={600}>{edge.toFixed(1)}m</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    }

    // ── Full Plan ──────────────────────────────────────────────────────

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            style={{
                borderRadius: 16, background: C.bg, display: "block",
                border: "1px solid #e0ddd5", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", cursor: "pointer"
            }}>
            <Defs />

            {/* Title bar */}
            <rect x={0} y={0} width={size} height={28} fill="rgba(26,26,46,0.04)" />
            <text x={size / 2} y={18} textAnchor="middle" fontSize={10} fontWeight="700"
                fontFamily="'Segoe UI', system-ui" fill="#888" letterSpacing="3">
                FLOOR PLAN
            </text>

            {/* Outer walls (double line) */}
            <rect x={oX - C.outerWall / 2} y={oY - C.outerWall / 2} width={oW + C.outerWall} height={oH + C.outerWall}
                fill="none" stroke={C.wall} strokeWidth={C.outerWall} />
            <rect x={oX - C.outerWall / 2 - 1.5} y={oY - C.outerWall / 2 - 1.5} width={oW + C.outerWall + 3} height={oH + C.outerWall + 3}
                fill="none" stroke={C.wall} strokeWidth={0.8} />

            {/* Rooms */}
            {rooms.map((room, i) => {
                if (!room.polygon?.length) return null;
                const isH = hover === i;
                const theme = getTheme(room.name, room.category);
                const svgP = room.polygon.map(p => to(p[0], p[1]));
                const sxs = svgP.map(p => p[0]), sys = svgP.map(p => p[1]);
                const rx = Math.min(...sxs), ry = Math.min(...sys), rw = Math.max(...sxs) - rx, rh = Math.max(...sys) - ry;
                const [cx, cy] = to(room.centroid[0], room.centroid[1]);
                const area = room.area_m2 ?? room.target_area;
                const nameFS = Math.max(7.5, Math.min(12, Math.min(rw, rh) / 5.5));
                const floorPat = (room.category === "service" || room.name.toLowerCase().includes("bath") || room.name.toLowerCase().includes("toilet") || room.name.toLowerCase().includes("kitchen"))
                    ? "url(#tile)" : "url(#wood)";

                return (
                    <g key={i} onClick={() => setZoom(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                        style={{ cursor: "pointer" }}>
                        {/* Room fill + floor texture */}
                        <polygon points={pts(room.polygon)} fill={isH ? theme.floor2 : theme.floor}
                            stroke={C.wallInner} strokeWidth={C.innerWall} strokeLinejoin="miter" />
                        <polygon points={pts(room.polygon)} fill={floorPat} />
                        {/* Hover glow */}
                        {isH && <polygon points={pts(room.polygon)} fill="rgba(108,99,255,0.05)" stroke={theme.accent} strokeWidth={2} />}
                        {/* Furniture */}
                        {resolve(room.name, room.category, { x: rx, y: ry, w: rw, h: rh, c: isH ? theme.furnSel : theme.furniture, hi: isH })}
                        {/* Room name */}
                        <text x={cx} y={cy - (rh > 45 ? 5 : 0)} textAnchor="middle"
                            fontSize={nameFS} fontWeight="700" fontFamily="'Segoe UI', system-ui"
                            fill={theme.text} letterSpacing="0.5" style={{ pointerEvents: "none", textTransform: "uppercase" }}>
                            {room.name.length > 14 ? room.name.slice(0, 13) + "…" : room.name}
                        </text>
                        {/* Area */}
                        {rh > 25 && <text x={cx} y={cy + nameFS * 1.1} textAnchor="middle"
                            fontSize={nameFS * 0.75} fontFamily="'Segoe UI', system-ui"
                            fill={theme.text} opacity={0.5} style={{ pointerEvents: "none" }}>
                            {area.toFixed(0)} m²
                        </text>}
                        {/* Windows on outer edges */}
                        {svgP.map((p, j) => {
                            const np = svgP[(j + 1) % svgP.length];
                            const mid = [(p[0] + np[0]) / 2, (p[1] + np[1]) / 2];
                            const isOuter = mid[0] <= oX + 3 || mid[0] >= oX + oW - 3 || mid[1] <= oY + 3 || mid[1] >= oY + oH - 3;
                            if (!isOuter) return null;
                            return <Window key={j} x1={p[0]} y1={p[1]} x2={np[0]} y2={np[1]} />;
                        })}
                        {/* Door */}
                        <Door cx={rx + 3} cy={ry + rh - 3} r={Math.min(rw * 0.15, 15)} side="bl" />
                    </g>
                );
            })}

            {/* Scale bar */}
            <g>
                <line x1={PAD} y1={size - 20} x2={PAD + sc * 5} y2={size - 20} stroke="#333" strokeWidth={1.8} />
                <line x1={PAD} y1={size - 17} x2={PAD} y2={size - 23} stroke="#333" strokeWidth={1.2} />
                <line x1={PAD + sc * 5} y1={size - 17} x2={PAD + sc * 5} y2={size - 23} stroke="#333" strokeWidth={1.2} />
                {[1, 2, 3, 4].map(n => <line key={n} x1={PAD + sc * n} y1={size - 18} x2={PAD + sc * n} y2={size - 22} stroke="#666" strokeWidth={0.4} />)}
                <text x={PAD + sc * 2.5} y={size - 8} textAnchor="middle" fontSize={9} fill="#777" fontFamily="'Segoe UI', system-ui" fontWeight={500}>5 m</text>
            </g>

            {/* North arrow */}
            <g transform={`translate(${size - PAD + 16}, ${PAD - 14})`}>
                <text textAnchor="middle" fontSize={11} fontWeight="700" fill="#333" fontFamily="'Segoe UI'">N</text>
                <polygon points="-3,6 0,16 3,6" fill="#333" />
                <line x1={0} y1={4} x2={0} y2={6} stroke="#333" strokeWidth={1.2} />
            </g>

            {/* Legend */}
            {[
                { l: "Living / Public", c: C.living.floor, b: C.living.accent },
                { l: "Bedrooms", c: C.bedroom.floor, b: C.bedroom.accent },
                { l: "Service", c: C.kitchen.floor, b: C.kitchen.accent },
            ].map((it, i) => (
                <g key={i} transform={`translate(${PAD + i * 100}, ${size - 40})`}>
                    <rect width={14} height={14} rx={2} fill={it.c} stroke={it.b} strokeWidth={1.4} />
                    <text x={18} y={11} fontSize={9} fill="#888" fontFamily="'Segoe UI', system-ui" fontWeight={500}>{it.l}</text>
                </g>
            ))}
        </svg>
    );
}
