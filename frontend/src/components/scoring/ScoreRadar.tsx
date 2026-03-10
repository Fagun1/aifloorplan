"use client";
/**
 * SVG Radar Chart — renders 8 architecture scoring dimensions.
 */
import React from "react";

interface Props {
    scores: Record<string, number>;
    size?: number;
}

const DIMENSION_LABELS: Record<string, string> = {
    space_utilization: "Space",
    adjacency_satisfaction: "Adjacency",
    aspect_ratio_quality: "Aspect",
    natural_light_access: "Light",
    circulation_efficiency: "Circulation",
    privacy_score: "Privacy",
    orientation_match: "Orientation",
    structural_regularity: "Structure",
};

export default function ScoreRadar({ scores, size = 280 }: Props) {
    const keys = Object.keys(DIMENSION_LABELS);
    const values = keys.map(k => (scores[k] ?? 0) / 100);
    const n = keys.length;
    const cx = size / 2;
    const cy = size / 2;
    const r = (size / 2) * 0.65;
    const labelR = (size / 2) * 0.88;

    function polar(i: number, radius: number): [number, number] {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    }

    // Polygon for scores
    const scorePoints = values.map((v, i) => polar(i, r * v));
    const scorePath = scorePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

    // Grid rings
    const rings = [0.25, 0.5, 0.75, 1.0];

    return (
        <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
            {/* Grid rings */}
            {rings.map(ring => {
                const pts = keys.map((_, i) => polar(i, r * ring));
                const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
                return (
                    <path key={ring} d={path} fill="none"
                        stroke={ring === 1 ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.05)"}
                        strokeWidth={ring === 1 ? 1.5 : 1} />
                );
            })}

            {/* Axes */}
            {keys.map((_, i) => {
                const [ax, ay] = polar(i, r);
                return <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
            })}

            {/* Score polygon */}
            <path d={scorePath} fill="rgba(108,99,255,0.2)" stroke="#6c63ff" strokeWidth={2} />

            {/* Score dots */}
            {scorePoints.map(([px, py], i) => (
                <circle key={i} cx={px} cy={py} r={4} fill="#48c9b0" stroke="#fff" strokeWidth={1.5} />
            ))}

            {/* Labels */}
            {keys.map((key, i) => {
                const [lx, ly] = polar(i, labelR);
                const label = DIMENSION_LABELS[key] ?? key;
                const val = (scores[key] ?? 0).toFixed(1);
                return (
                    <g key={key}>
                        <text x={lx} y={ly - 6} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>{label}</text>
                        <text x={lx} y={ly + 8} textAnchor="middle" fill="#6c63ff" fontSize={11} fontWeight="bold">{val}</text>
                    </g>
                );
            })}

            {/* Center label */}
            <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={10}>Score</text>
        </svg>
    );
}
