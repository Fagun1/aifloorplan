"use client";
/**
 * PlotCanvas — Konva.js polygon drawing tool.
 * Dynamically imported (no SSR) to avoid the 'canvas' module error.
 */
import { Stage, Layer, Line, Circle, Text } from "react-konva";

interface Props {
    vertices: [number, number][];
    onVerticesChange: (verts: [number, number][]) => void;
}

const CANVAS_SIZE = 520;
const SCALE = 10; // px per meter

function toCanvas(mx: number, my: number): [number, number] {
    return [CANVAS_SIZE / 2 + mx * SCALE, CANVAS_SIZE / 2 - my * SCALE];
}

export default function PlotCanvas({ vertices, onVerticesChange }: Props) {
    function handleClick(e: any) {
        const pos = e.target.getStage().getPointerPosition();
        // Snap to 0.5m grid
        const mx = Math.round((pos.x - CANVAS_SIZE / 2) / SCALE * 2) / 2;
        const my = Math.round((CANVAS_SIZE / 2 - pos.y) / SCALE * 2) / 2;

        // If clicking near first vertex (within 10px), close polygon — don't add vertex
        if (vertices.length >= 3) {
            const [fx, fy] = toCanvas(vertices[0][0], vertices[0][1]);
            if (Math.abs(pos.x - fx) < 10 && Math.abs(pos.y - fy) < 10) return;
        }
        onVerticesChange([...vertices, [mx, my]]);
    }

    const canvasPoints = vertices.flatMap(([x, y]) => toCanvas(x, y));

    return (
        <div style={{
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            cursor: "crosshair",
            background: "#060610",
        }}>
            <Stage width={CANVAS_SIZE} height={CANVAS_SIZE} onClick={handleClick}>
                <Layer>
                    {/* Grid lines */}
                    {Array.from({ length: Math.ceil(CANVAS_SIZE / SCALE) + 1 }).map((_, i) => {
                        const x = i * SCALE;
                        const y = i * SCALE;
                        return [
                            <Line key={`v${i}`} points={[x, 0, x, CANVAS_SIZE]} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />,
                            <Line key={`h${i}`} points={[0, y, CANVAS_SIZE, y]} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />,
                        ];
                    })}

                    {/* Center crosshair */}
                    <Line points={[CANVAS_SIZE / 2, 0, CANVAS_SIZE / 2, CANVAS_SIZE]} stroke="rgba(108,99,255,0.2)" strokeWidth={1} dash={[4, 4]} />
                    <Line points={[0, CANVAS_SIZE / 2, CANVAS_SIZE, CANVAS_SIZE / 2]} stroke="rgba(108,99,255,0.2)" strokeWidth={1} dash={[4, 4]} />

                    {/* Polygon */}
                    {vertices.length >= 2 && (
                        <Line
                            points={canvasPoints}
                            stroke="#6c63ff"
                            strokeWidth={2}
                            closed={vertices.length >= 3}
                            fill={vertices.length >= 3 ? "rgba(108,99,255,0.12)" : undefined}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* Vertices */}
                    {vertices.map(([x, y], i) => {
                        const [cx, cy] = toCanvas(x, y);
                        return (
                            <Circle
                                key={i}
                                x={cx} y={cy}
                                radius={i === 0 ? 7 : 5}
                                fill={i === 0 ? "#48c9b0" : "#6c63ff"}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                        );
                    })}

                    {/* Coordinate labels */}
                    {vertices.map(([x, y], i) => {
                        const [cx, cy] = toCanvas(x, y);
                        return (
                            <Text
                                key={`lbl${i}`}
                                x={cx + 8} y={cy - 16}
                                text={`${x},${y}m`}
                                fill="rgba(255,255,255,0.4)"
                                fontSize={9}
                            />
                        );
                    })}

                    {/* Center label */}
                    <Text x={CANVAS_SIZE / 2 - 20} y={CANVAS_SIZE / 2 + 8} text="0,0" fill="rgba(108,99,255,0.4)" fontSize={10} />
                </Layer>
            </Stage>
        </div>
    );
}
