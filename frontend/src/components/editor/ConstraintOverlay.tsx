"use client";
/**
 * ConstraintOverlay — red semi-transparent fill over rooms with violations.
 * Rendered as a Konva Layer on top of the normal canvas layers.
 */
import { Layer, Line, Text } from "react-konva";
import { useEditorStore } from "@/store/editorStore";
import type { LayoutCandidate } from "@/lib/types";

interface View {
    toScreen: (p: [number, number]) => [number, number];
    scale: number;
}

interface Props {
    candidate: LayoutCandidate | null;
    view: View;
}

export function ConstraintOverlay({ candidate, view }: Props) {
    const { violations } = useEditorStore();

    if (!candidate || violations.length === 0) return null;

    const violatingNames = new Set(violations.map(v => v.room_name));

    return (
        <Layer>
            {candidate.rooms
                .filter(r => violatingNames.has(r.name))
                .map(room => {
                    const screenPts = room.polygon.flatMap(p => view.toScreen(p));
                    const [cx, cy] = view.toScreen(room.centroid);
                    const violation = violations.find(v => v.room_name === room.name);

                    return (
                        <React.Fragment key={room.name}>
                            {/* Red fill */}
                            <Line
                                points={screenPts}
                                closed
                                fill="rgba(255,101,132,0.22)"
                                stroke="rgba(255,101,132,0.8)"
                                strokeWidth={2}
                                dash={[6, 3]}
                            />
                            {/* Warning label */}
                            <Text
                                x={cx - 30}
                                y={cy - 8}
                                text={`⚠ ${violation?.rules[0]?.replace(/_/g, " ") ?? ""}`}
                                fill="#ff6584"
                                fontSize={Math.max(9, view.scale * 0.7)}
                                fontStyle="bold"
                            />
                        </React.Fragment>
                    );
                })}
        </Layer>
    );
}

import React from "react";
