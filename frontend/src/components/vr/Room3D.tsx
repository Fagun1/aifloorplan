"use client";

import { useRef } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { VRRoom, VRFurniture } from "@/store/vrStore";

// ── Furniture Mesh ──────────────────────────────────────────────────────────

function FurnitureMesh({ item }: { item: VRFurniture }) {
    return (
        <group
            position={item.position}
            rotation={[0, (item.rotation_y * Math.PI) / 180, 0]}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[item.size[0], item.size[1], item.size[2]]} />
                <meshStandardMaterial
                    color={item.color}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>
        </group>
    );
}

// ── Room 3D ─────────────────────────────────────────────────────────────────

type Room3DProps = {
    room: VRRoom;
    selected: boolean;
    showFurniture: boolean;
    showLabels: boolean;
    showLighting: boolean;
    onClick: () => void;
};

export function Room3D({
    room,
    selected,
    showFurniture,
    showLabels,
    showLighting,
    onClick,
}: Room3DProps) {
    const [px, py, pz] = room.position;
    const [w, h, d] = room.size;

    const wallThickness = 0.15;
    const floorY = py;
    const ceilY = py + h;

    // Wall emission when selected
    const wallEmissive = selected ? "#3344bb" : "#000000";
    const wallEmissiveIntensity = selected ? 0.15 : 0;

    return (
        <group onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}>
            {/* Floor */}
            <mesh position={[px, floorY, pz]} receiveShadow>
                <boxGeometry args={[w, 0.05, d]} />
                <meshStandardMaterial
                    color={room.material.floor}
                    roughness={room.material.roughness}
                    metalness={room.material.metalness}
                />
            </mesh>

            {/* Ceiling */}
            <mesh position={[px, ceilY, pz]}>
                <boxGeometry args={[w, 0.05, d]} />
                <meshStandardMaterial color={room.material.ceiling} roughness={0.9} />
            </mesh>

            {/* Walls — North */}
            <mesh position={[px, py + h / 2, pz - d / 2]} castShadow receiveShadow>
                <boxGeometry args={[w, h, wallThickness]} />
                <meshStandardMaterial
                    color={room.material.wall}
                    roughness={room.material.roughness}
                    emissive={wallEmissive}
                    emissiveIntensity={wallEmissiveIntensity}
                />
            </mesh>
            {/* South */}
            <mesh position={[px, py + h / 2, pz + d / 2]} castShadow receiveShadow>
                <boxGeometry args={[w, h, wallThickness]} />
                <meshStandardMaterial
                    color={room.material.wall}
                    roughness={room.material.roughness}
                    emissive={wallEmissive}
                    emissiveIntensity={wallEmissiveIntensity}
                />
            </mesh>
            {/* East */}
            <mesh position={[px + w / 2, py + h / 2, pz]} castShadow receiveShadow>
                <boxGeometry args={[wallThickness, h, d]} />
                <meshStandardMaterial
                    color={room.material.wall}
                    roughness={room.material.roughness}
                    emissive={wallEmissive}
                    emissiveIntensity={wallEmissiveIntensity}
                />
            </mesh>
            {/* West */}
            <mesh position={[px - w / 2, py + h / 2, pz]} castShadow receiveShadow>
                <boxGeometry args={[wallThickness, h, d]} />
                <meshStandardMaterial
                    color={room.material.wall}
                    roughness={room.material.roughness}
                    emissive={wallEmissive}
                    emissiveIntensity={wallEmissiveIntensity}
                />
            </mesh>

            {/* Room light */}
            {showLighting && (
                <pointLight
                    position={room.light.position}
                    intensity={room.light.intensity}
                    color={room.light.color}
                    castShadow={room.light.cast_shadow}
                    distance={Math.max(w, d) * 2.5}
                    decay={2}
                />
            )}

            {/* Furniture */}
            {showFurniture && room.furniture.map((f, i) => (
                <FurnitureMesh key={i} item={f} />
            ))}

            {/* Room label */}
            {showLabels && (
                <Text
                    position={[px, py + h * 0.5, pz]}
                    color={selected ? "#88aaff" : "#ffffff"}
                    fontSize={0.35}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {room.name}
                </Text>
            )}
        </group>
    );
}
