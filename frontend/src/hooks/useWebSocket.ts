/**
 * useWebSocket — connects to the backend WS editor and handles messages.
 */
import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";

function getWebSocketBase(): string {
    if (typeof window === "undefined") {
        return process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
    }

    const configured = process.env.NEXT_PUBLIC_WS_URL;
    if (configured) {
        return configured.replace(/\/$/, "");
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
}

export function useWebSocket(projectId: string | null) {
    const ws = useRef<WebSocket | null>(null);
    const { setViolations, setConnected } = useEditorStore();

    useEffect(() => {
        if (!projectId) return;

        const wsBase = getWebSocketBase();
        const url = `${wsBase}/ws/editor/${projectId}`;
        const socket = new WebSocket(url);
        ws.current = socket;

        socket.onopen = () => {
            setConnected(true);
            // Keepalive ping every 25s
            const interval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "ping", payload: {} }));
                }
            }, 25000);
            (socket as any)._pingInterval = interval;
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "constraint_update") {
                    setViolations(msg.payload?.violations ?? []);
                }
                // score_update and other messages handled by caller via onMessage
            } catch { }
        };

        socket.onclose = () => {
            setConnected(false);
            clearInterval((socket as any)._pingInterval);
        };

        socket.onerror = () => setConnected(false);

        return () => {
            clearInterval((socket as any)._pingInterval);
            socket.close();
        };
    }, [projectId]);

    const send = useCallback((type: string, payload: Record<string, unknown>) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    const sendRoomMove = useCallback((
        roomName: string,
        polygon: [number, number][],
        centroid: [number, number],
        buildablePolygon?: [number, number][],
    ) => {
        send("room_move", { room_name: roomName, polygon, centroid, buildable_polygon: buildablePolygon });
    }, [send]);

    const requestRescore = useCallback((candidate: unknown) => {
        send("request_rescore", { candidate });
    }, [send]);

    const switchFloor = useCallback((floorNumber: number) => {
        send("floor_switch", { floor_number: floorNumber });
    }, [send]);

    return { send, sendRoomMove, requestRescore, switchFloor };
}
