"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment, Grid, Stats } from "@react-three/drei";
import { Room3D } from "@/components/vr/Room3D";
import { useVRStore } from "@/store/vrStore";

// ── Loading Fallback ────────────────────────────────────────────────────────
function SceneLoader() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6c63ff" wireframe />
        </mesh>
    );
}

// ── Ground plane ────────────────────────────────────────────────────────────
function Ground({ bounds }: { bounds: { min_x: number; max_x: number; min_y: number; max_y: number } }) {
    const cx = (bounds.min_x + bounds.max_x) / 2;
    const cz = (bounds.min_y + bounds.max_y) / 2;
    const w = Math.max(bounds.max_x - bounds.min_x + 10, 30);
    const d = Math.max(bounds.max_y - bounds.min_y + 10, 30);
    return (
        <mesh position={[cx, -0.06, cz]} receiveShadow>
            <boxGeometry args={[w, 0.1, d]} />
            <meshStandardMaterial color="#3a4a3a" roughness={1} />
        </mesh>
    );
}

// ── Main Scene ──────────────────────────────────────────────────────────────
function VRSceneContent() {
    const { scene, selectedRoom, setSelectedRoom, showFurniture, showLabels, showLighting } = useVRStore();

    if (!scene) return null;

    return (
        <>
            {/* Sky */}
            <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={1} />

            {/* Environment (reflection probe) */}
            <Environment preset="apartment" />

            {/* Global lights */}
            <ambientLight
                intensity={scene.ambient_light.intensity}
                color={scene.ambient_light.color}
            />
            <directionalLight
                position={scene.sun_light.direction as [number, number, number]}
                intensity={scene.sun_light.intensity}
                color={scene.sun_light.color}
                castShadow={scene.sun_light.cast_shadow}
                shadow-mapSize={[2048, 2048]}
            />

            {/* Ground */}
            <Ground bounds={scene.bounds} />

            {/* Grid helper */}
            <Grid
                args={[60, 60]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#333333"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#555555"
                fadeDistance={50}
                fadeStrength={1}
                position={[
                    (scene.bounds.min_x + scene.bounds.max_x) / 2,
                    0,
                    (scene.bounds.min_y + scene.bounds.max_y) / 2,
                ]}
            />

            {/* All rooms */}
            {scene.rooms.map((room) => (
                <Room3D
                    key={room.id}
                    room={room}
                    selected={selectedRoom === room.id}
                    showFurniture={showFurniture}
                    showLabels={showLabels}
                    showLighting={showLighting}
                    onClick={() => setSelectedRoom(selectedRoom === room.id ? null : room.id)}
                />
            ))}
        </>
    );
}

// ── VRScene Canvas ──────────────────────────────────────────────────────────
export function VRScene() {
    const { cameraMode, scene } = useVRStore();

    // Default camera position — orbiting slightly above center
    const center = scene
        ? [
            (scene.bounds.min_x + scene.bounds.max_x) / 2,
            8,
            (scene.bounds.min_y + scene.bounds.max_y) / 2 + 20,
        ]
        : [0, 8, 20];

    return (
        <Canvas
            shadows
            camera={{ position: center as [number, number, number], fov: 65, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: false }}
            style={{ width: "100%", height: "100%" }}
        >
            <Suspense fallback={<SceneLoader />}>
                <VRSceneContent />
                <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.08}
                    minDistance={3}
                    maxDistance={80}
                    maxPolarAngle={Math.PI / 2.05}
                    target={
                        scene
                            ? [
                                (scene.bounds.min_x + scene.bounds.max_x) / 2,
                                1,
                                (scene.bounds.min_y + scene.bounds.max_y) / 2,
                            ]
                            : [0, 0, 0]
                    }
                />
            </Suspense>
            {process.env.NODE_ENV === "development" && <Stats />}
        </Canvas>
    );
}
