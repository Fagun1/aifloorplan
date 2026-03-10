(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStudioStore",
    ()=>useStudioStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
"use client";
;
const useStudioStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set)=>({
        mode: "draft",
        isAdvancedMode: false,
        draftPolygon: [],
        showFurniture: false,
        floorIndex: 0,
        showAIPanel: false,
        showParameterPanel: false,
        zoom: 1,
        pan: {
            x: 0,
            y: 0
        },
        setMode: (m)=>set({
                mode: m
            }),
        toggleAdvancedMode: ()=>set((s)=>({
                    isAdvancedMode: !s.isAdvancedMode
                })),
        setDraftPolygon: (pts)=>set({
                draftPolygon: pts
            }),
        addDraftVertex: (pt)=>set((s)=>({
                    draftPolygon: [
                        ...s.draftPolygon,
                        pt
                    ]
                })),
        removeLastDraftVertex: ()=>set((s)=>({
                    draftPolygon: s.draftPolygon.slice(0, -1)
                })),
        clearDraft: ()=>set({
                draftPolygon: []
            }),
        setShowFurniture: (v)=>set({
                showFurniture: v
            }),
        setFloorIndex: (i)=>set({
                floorIndex: i
            }),
        setShowAIPanel: (v)=>set((s)=>({
                    showAIPanel: v,
                    showParameterPanel: v ? false : s.showParameterPanel
                })),
        setShowParameterPanel: (v)=>set((s)=>({
                    showParameterPanel: v,
                    showAIPanel: v ? false : s.showAIPanel
                })),
        setZoom: (z)=>set({
                zoom: Math.max(0.25, Math.min(4, z))
            }),
        setPan: (p)=>set({
                pan: p
            })
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/lib/apiClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Expanded API client — covers auth, projects, plots, and layouts.
 * All API calls require an auth token stored in localStorage.
 */ __turbopack_context__.s([
    "analyzeLayout",
    ()=>analyzeLayout,
    "clearToken",
    ()=>clearToken,
    "createProject",
    ()=>createProject,
    "deleteProject",
    ()=>deleteProject,
    "explainImprovement",
    ()=>explainImprovement,
    "generateLayouts",
    ()=>generateLayouts,
    "getMe",
    ()=>getMe,
    "getPlot",
    ()=>getPlot,
    "getProject",
    ()=>getProject,
    "getToken",
    ()=>getToken,
    "improveLayout",
    ()=>improveLayout,
    "listProjects",
    ()=>listProjects,
    "login",
    ()=>login,
    "register",
    ()=>register,
    "setPlot",
    ()=>setPlot,
    "setToken",
    ()=>setToken,
    "updateProject",
    ()=>updateProject
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:8000") ?? "http://localhost:8000";
function getToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return localStorage.getItem("auth_token");
}
function setToken(token) {
    localStorage.setItem("auth_token", token);
}
function clearToken() {
    localStorage.removeItem("auth_token");
}
// ── Base fetch ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}, auth = false) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };
    if (auth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });
    if (!resp.ok) {
        const text = await resp.text().catch(()=>"");
        throw new Error(text || `Request failed (${resp.status})`);
    }
    if (resp.status === 204) return undefined;
    return resp.json();
}
async function register(email, password, full_name) {
    return apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
            full_name
        })
    });
}
async function login(email, password) {
    return apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });
}
async function getMe() {
    return apiFetch("/api/v1/auth/me", {}, true);
}
async function createProject(data) {
    return apiFetch("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify(data)
    }, true);
}
async function listProjects() {
    return apiFetch("/api/v1/projects", {}, true);
}
async function getProject(id) {
    return apiFetch(`/api/v1/projects/${id}`, {}, true);
}
async function updateProject(id, data) {
    return apiFetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    }, true);
}
async function deleteProject(id) {
    return apiFetch(`/api/v1/projects/${id}`, {
        method: "DELETE"
    }, true);
}
async function setPlot(projectId, data) {
    return apiFetch(`/api/v1/projects/${projectId}/plot`, {
        method: "POST",
        body: JSON.stringify(data)
    }, true);
}
async function getPlot(projectId) {
    return apiFetch(`/api/v1/projects/${projectId}/plot`, {}, true);
}
async function generateLayouts(req) {
    return apiFetch("/api/v1/layouts/generate", {
        method: "POST",
        body: JSON.stringify(req)
    }, false);
}
async function improveLayout(req) {
    return apiFetch("/api/v1/layouts/improve", {
        method: "POST",
        body: JSON.stringify(req)
    }, false);
}
async function analyzeLayout(layout, gate_direction) {
    return apiFetch("/api/v1/layouts/analyze", {
        method: "POST",
        body: JSON.stringify({
            layout,
            gate_direction
        })
    }, false);
}
async function explainImprovement(original, improved, gate_direction) {
    return apiFetch("/api/v1/layouts/explain-improvement", {
        method: "POST",
        body: JSON.stringify({
            original_layout: original,
            improved_layout: improved,
            gate_direction
        })
    }, false);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/lib/geometry.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "minDimensionBoundingBox",
    ()=>minDimensionBoundingBox,
    "pointInPolygon",
    ()=>pointInPolygon,
    "polygonBounds",
    ()=>polygonBounds,
    "polygonCentroid",
    ()=>polygonCentroid,
    "polygonInsidePolygon",
    ()=>polygonInsidePolygon,
    "polygonsOverlap",
    ()=>polygonsOverlap
]);
function polygonBounds(poly) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of poly){
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) {
        return {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0
        };
    }
    return {
        minX,
        minY,
        maxX,
        maxY
    };
}
function polygonCentroid(poly) {
    let twiceArea = 0;
    let cx = 0;
    let cy = 0;
    const n = poly.length;
    if (n === 0) return [
        0,
        0
    ];
    for(let i = 0; i < n; i += 1){
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % n];
        const f = x1 * y2 - x2 * y1;
        twiceArea += f;
        cx += (x1 + x2) * f;
        cy += (y1 + y2) * f;
    }
    if (Math.abs(twiceArea) < 1e-8) {
        // fallback: average of vertices
        let sx = 0;
        let sy = 0;
        for (const [x, y] of poly){
            sx += x;
            sy += y;
        }
        return [
            sx / n,
            sy / n
        ];
    }
    const area = twiceArea * 0.5;
    return [
        cx / (6 * area),
        cy / (6 * area)
    ];
}
function minDimensionBoundingBox(poly) {
    const { minX, minY, maxX, maxY } = polygonBounds(poly);
    const w = maxX - minX;
    const h = maxY - minY;
    return Math.min(w, h);
}
function pointInPolygon(point, poly) {
    const [px, py] = point;
    let inside = false;
    const n = poly.length;
    for(let i = 0, j = n - 1; i < n; j = i, i += 1){
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const intersect = yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}
function polygonInsidePolygon(inner, outer) {
    if (inner.length === 0) return false;
    for (const p of inner){
        if (!pointInPolygon(p, outer)) return false;
    }
    return true;
}
function segmentsIntersect(a1, a2, b1, b2) {
    const [x1, y1] = a1;
    const [x2, y2] = a2;
    const [x3, y3] = b1;
    const [x4, y4] = b2;
    const d1x = x2 - x1;
    const d1y = y2 - y1;
    const d2x = x4 - x3;
    const d2y = y4 - y3;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-12) return false;
    const s = ((x3 - x1) * d2y - (y3 - y1) * d2x) / denom;
    const t = ((x3 - x1) * d1y - (y3 - y1) * d1x) / denom;
    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
function polygonsOverlap(a, b) {
    if (a.length === 0 || b.length === 0) return false;
    // quick bbox reject
    const ba = polygonBounds(a);
    const bb = polygonBounds(b);
    if (ba.maxX < bb.minX || bb.maxX < ba.minX || ba.maxY < bb.minY || bb.maxY < ba.minY) {
        return false;
    }
    // any vertex inside the other
    if (a.some((p)=>pointInPolygon(p, b)) || b.some((p)=>pointInPolygon(p, a))) {
        return true;
    }
    // edge intersection
    for(let i = 0; i < a.length; i += 1){
        const a1 = a[i];
        const a2 = a[(i + 1) % a.length];
        for(let j = 0; j < b.length; j += 1){
            const b1 = b[j];
            const b2 = b[(j + 1) % b.length];
            if (segmentsIntersect(a1, a2, b1, b2)) return true;
        }
    }
    return false;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/lib/constraints.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateCandidateConstraints",
    ()=>validateCandidateConstraints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$geometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/lib/geometry.ts [app-client] (ecmascript)");
;
function validateCandidateConstraints(candidate, buildablePolygon, opts = {}) {
    const minDim = opts.minDimensionM ?? 2.0;
    const result = {};
    const rooms = candidate.rooms;
    // Per-room checks
    for (const room of rooms){
        const reasons = [];
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$geometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polygonInsidePolygon"])(room.polygon, buildablePolygon)) {
            reasons.push("outside_buildable");
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$geometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["minDimensionBoundingBox"])(room.polygon) < minDim) {
            reasons.push("min_dimension_below_2m");
        }
        if (reasons.length) {
            result[room.name] = reasons;
        }
    }
    // Overlap checks
    for(let i = 0; i < rooms.length; i += 1){
        for(let j = i + 1; j < rooms.length; j += 1){
            const ri = rooms[i];
            const rj = rooms[j];
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$geometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polygonsOverlap"])(ri.polygon, rj.polygon)) {
                const msgI = `overlaps_with:${rj.name}`;
                const msgJ = `overlaps_with:${ri.name}`;
                if (!result[ri.name]) result[ri.name] = [];
                if (!result[ri.name].includes(msgI)) result[ri.name].push(msgI);
                if (!result[rj.name]) result[rj.name] = [];
                if (!result[rj.name].includes(msgJ)) result[rj.name].push(msgJ);
            }
        }
    }
    return result;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useLayoutStore",
    ()=>useLayoutStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/lib/apiClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$constraints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/lib/constraints.ts [app-client] (ecmascript)");
"use client";
;
;
;
const defaultRequest = {
    plot: {
        points: [
            [
                0,
                0
            ],
            [
                20,
                0
            ],
            [
                20,
                10
            ],
            [
                12,
                14
            ],
            [
                0,
                10
            ]
        ],
        gate_direction: "south"
    },
    rooms: [
        {
            name: "Living",
            target_area: 40,
            category: "public"
        },
        {
            name: "Kitchen",
            target_area: 20,
            category: "service"
        },
        {
            name: "Bed1",
            target_area: 18,
            category: "private"
        },
        {
            name: "Bed2",
            target_area: 18,
            category: "private"
        }
    ],
    setback_m: 1,
    num_candidates: 5,
    generation_seed: 1234
};
const useLayoutStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        request: defaultRequest,
        response: null,
        editedCandidate: null,
        roomViolations: {},
        selectedCandidateId: null,
        isLoading: false,
        error: null,
        analysis: null,
        analysisForCandidateId: null,
        analysisLoading: false,
        analysisOutdated: false,
        highlightedRoom: null,
        improvementExplanation: null,
        improvementExplanationLoading: false,
        improvementExplanationError: null,
        setSeed: (seed)=>set((s)=>({
                    request: {
                        ...s.request,
                        generation_seed: seed
                    }
                })),
        setSetback: (setback)=>set((s)=>({
                    request: {
                        ...s.request,
                        setback_m: setback
                    }
                })),
        setNumCandidates: (n)=>set((s)=>({
                    request: {
                        ...s.request,
                        num_candidates: n
                    }
                })),
        setPlotPoints: (points)=>set((s)=>({
                    request: {
                        ...s.request,
                        plot: {
                            ...s.request.plot,
                            points
                        }
                    }
                })),
        setUserAnswers: (answers)=>set((s)=>({
                    request: {
                        ...s.request,
                        user_answers: answers ?? undefined
                    }
                })),
        selectCandidate: (candidateId)=>set((state)=>{
                const base = state.response?.candidates.find((c)=>c.candidate_id === candidateId) ?? null;
                let editedCandidate = null;
                let roomViolations = {};
                let analysisOutdated = state.analysisOutdated;
                if (base && state.response) {
                    editedCandidate = {
                        ...base,
                        rooms: base.rooms.map((r)=>({
                                ...r,
                                polygon: r.polygon.map(([x, y])=>[
                                        x,
                                        y
                                    ]),
                                centroid: [
                                    r.centroid[0],
                                    r.centroid[1]
                                ]
                            }))
                    };
                    roomViolations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$constraints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCandidateConstraints"])(editedCandidate, state.response.buildable_polygon, {
                        minDimensionM: 2.0
                    });
                    if (state.analysis && state.analysisForCandidateId !== editedCandidate.candidate_id) {
                        analysisOutdated = true;
                    }
                }
                return {
                    selectedCandidateId: candidateId,
                    editedCandidate,
                    roomViolations,
                    analysisOutdated
                };
            }),
        updateRoomPolygon: (roomName, polygon)=>set((state)=>{
                if (!state.editedCandidate || !state.response) return state;
                const rooms = state.editedCandidate.rooms.map((r)=>r.name === roomName ? {
                        ...r,
                        polygon: polygon.map(([x, y])=>[
                                x,
                                y
                            ])
                    } : r);
                const updated = {
                    ...state.editedCandidate,
                    rooms
                };
                const roomViolations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$constraints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCandidateConstraints"])(updated, state.response.buildable_polygon, {
                    minDimensionM: 2.0
                });
                return {
                    editedCandidate: updated,
                    roomViolations,
                    analysisOutdated: state.analysis ? true : state.analysisOutdated
                };
            }),
        runGeneration: async ()=>{
            set({
                isLoading: true,
                error: null
            });
            try {
                const req = get().request;
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateLayouts"])(req);
                const first = response.candidates[0]?.candidate_id ?? null;
                let editedCandidate = null;
                let roomViolations = {};
                if (first !== null) {
                    const base = response.candidates.find((c)=>c.candidate_id === first) ?? null;
                    if (base) {
                        editedCandidate = {
                            ...base,
                            rooms: base.rooms.map((r)=>({
                                    ...r,
                                    polygon: r.polygon.map(([x, y])=>[
                                            x,
                                            y
                                        ]),
                                    centroid: [
                                        r.centroid[0],
                                        r.centroid[1]
                                    ]
                                }))
                        };
                        roomViolations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$constraints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCandidateConstraints"])(editedCandidate, response.buildable_polygon, {
                            minDimensionM: 2.0
                        });
                    }
                }
                set({
                    response,
                    editedCandidate,
                    roomViolations,
                    selectedCandidateId: first,
                    isLoading: false,
                    error: null,
                    // new generation invalidates previous analysis
                    analysisOutdated: Boolean(get().analysis)
                });
            } catch (e) {
                set({
                    isLoading: false,
                    error: e instanceof Error ? e.message : String(e)
                });
            }
        },
        runAnalysis: async (gate_direction)=>{
            const state = get();
            const candidate = state.editedCandidate ? state.editedCandidate : state.response?.candidates.find((c)=>c.candidate_id === state.selectedCandidateId) ?? state.response?.candidates[0];
            if (!candidate) {
                return;
            }
            set({
                analysisLoading: true
            });
            try {
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeLayout"])(candidate, gate_direction);
                set({
                    analysis: result,
                    analysisForCandidateId: candidate.candidate_id,
                    analysisLoading: false,
                    analysisOutdated: false
                });
            } catch (e) {
                set({
                    analysisLoading: false,
                    error: e instanceof Error ? e.message : String(e)
                });
            }
        },
        runExplainImprovement: async (gate_direction)=>{
            const state = get();
            const baseOriginal = state.response?.candidates.find((c)=>c.candidate_id === state.selectedCandidateId) ?? state.response?.candidates[0];
            const improved = state.editedCandidate ?? baseOriginal;
            if (!baseOriginal || !improved) {
                return;
            }
            set({
                improvementExplanationLoading: true,
                improvementExplanationError: null
            });
            try {
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["explainImprovement"])(baseOriginal, improved, gate_direction);
                set({
                    improvementExplanation: result,
                    improvementExplanationLoading: false,
                    improvementExplanationError: null
                });
            } catch (e) {
                set({
                    improvementExplanationLoading: false,
                    improvementExplanationError: e instanceof Error ? e.message : String(e)
                });
            }
        },
        setHighlightedRoom: (roomName)=>set({
                highlightedRoom: roomName
            })
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Studio design tokens from FRONTEND_PRODUCT_VISION.md
 */ __turbopack_context__.s([
    "TOKENS",
    ()=>TOKENS
]);
const TOKENS = {
    CANVAS_WHITE: "#FAFAF8",
    PAPER_WHITE: "#FFFFFF",
    WALL_EXTERIOR: "#1A1A1A",
    WALL_INTERIOR: "#4A4A4A",
    WALL_FILL: "#2C2C2C",
    LABEL_PRIMARY: "#333333",
    LABEL_SECONDARY: "#888888",
    ACCENT: "#2A5FE6",
    ACCENT_HOVER: "#1E4ABF",
    GRID_LINE: "#E8E8E4",
    GRID_LINE_MAJOR: "#D4D4D0",
    DOOR_STROKE: "#555555",
    FURNITURE_FILL: "#E0DDD8",
    FURNITURE_STROKE: "#AAAAAA",
    SUCCESS: "#2E7D52",
    WARNING: "#C17B2A",
    ERROR: "#C0392B",
    SHADOW: "rgba(0,0,0,0.06)"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TopBar",
    ()=>TopBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function TopBar() {
    _s();
    const { mode, isAdvancedMode, setMode, setShowParameterPanel, setDraftPolygon } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const { request } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    const handleEditPlot = ()=>{
        setDraftPolygon(request.plot.points);
        setMode("draft");
        setShowParameterPanel(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "flex h-12 shrink-0 items-center justify-between border-b px-6",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
            borderColor: "rgba(0,0,0,0.06)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-sm font-medium",
                style: {
                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                },
                children: mode === "draft" ? "Draft" : "Plan"
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4",
                children: [
                    mode === "plan" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: handleEditPlot,
                        className: "text-xs font-medium uppercase",
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT
                        },
                        children: "Edit Plot"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this),
                    isAdvancedMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded px-2 py-0.5 text-xs font-medium",
                        style: {
                            background: "#F5F3EE",
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                        },
                        children: "ADVANCED"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx",
                        lineNumber: 46,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_s(TopBar, "Clp9P54qk3GYMT5WkKJs5IbAtAM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"]
    ];
});
_c = TopBar;
var _c;
__turbopack_context__.k.register(_c, "TopBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/controls/FloorSelector.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FloorSelector",
    ()=>FloorSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function FloorSelector({ floorIndex, numFloors }) {
    _s();
    const { setFloorIndex } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-1",
        children: Array.from({
            length: numFloors
        }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setFloorIndex(i),
                className: "rounded-full px-2 py-1 text-xs font-semibold uppercase",
                style: {
                    background: i === floorIndex ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT : "transparent",
                    color: i === floorIndex ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY,
                    border: `1px solid ${i === floorIndex ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY}`
                },
                children: i === 0 ? "G" : String(i)
            }, i, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/FloorSelector.tsx",
                lineNumber: 18,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/FloorSelector.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_s(FloorSelector, "xMUNIJnHNRahrndtDy09FowQog4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = FloorSelector;
var _c;
__turbopack_context__.k.register(_c, "FloorSelector");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/controls/LeftRail.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LeftRail",
    ()=>LeftRail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$FloorSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/controls/FloorSelector.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function LeftRail({ candidate }) {
    _s();
    const { mode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const numFloors = 1;
    if (mode !== "plan") return null;
    if (numFloors <= 1) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "flex w-12 shrink-0 flex-col items-center gap-2 border-r py-4",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
            borderColor: "rgba(0,0,0,0.06)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$FloorSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FloorSelector"], {
            floorIndex: 0,
            numFloors: numFloors
        }, void 0, false, {
            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/LeftRail.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/LeftRail.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_s(LeftRail, "gyiBxnVO2N7h1WQk1xdkEkhLiOA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = LeftRail;
var _c;
__turbopack_context__.k.register(_c, "LeftRail");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/controls/FurnitureToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FurnitureToggle",
    ()=>FurnitureToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function FurnitureToggle() {
    _s();
    const { showFurniture, setShowFurniture } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "flex cursor-pointer items-center gap-2 text-xs",
        style: {
            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: showFurniture,
                onChange: (e)=>setShowFurniture(e.target.checked),
                className: "h-3 w-3 rounded"
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/FurnitureToggle.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "uppercase",
                children: "Furniture"
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/FurnitureToggle.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/FurnitureToggle.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
_s(FurnitureToggle, "klV8+hSNYASSBMKaq9pHIBz29Jg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = FurnitureToggle;
var _c;
__turbopack_context__.k.register(_c, "FurnitureToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/controls/BottomBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BottomBar",
    ()=>BottomBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$FurnitureToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/controls/FurnitureToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function BottomBar() {
    _s();
    const { mode, zoom } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        className: "flex h-8 shrink-0 items-center justify-between px-6",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY,
            fontSize: 9
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    "Scale 1:",
                    Math.round(100 / zoom)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/BottomBar.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            mode === "plan" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$FurnitureToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FurnitureToggle"], {}, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/BottomBar.tsx",
                lineNumber: 22,
                columnNumber: 27
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/controls/BottomBar.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_s(BottomBar, "GMQ8XcW34O0vxZDGs1kfL8zS4JA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = BottomBar;
var _c;
__turbopack_context__.k.register(_c, "BottomBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParameterPanel",
    ()=>ParameterPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function QuestionInput({ question, value, onChange }) {
    const { text, type, options } = question;
    const hasOptions = options?.length > 0;
    if (type === "boolean" || hasOptions && type !== "numeric" && type !== "text") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "flex flex-col gap-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs",
                    style: {
                        color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                    },
                    children: text
                }, void 0, false, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: String(value ?? question.default ?? options?.[0] ?? ""),
                    onChange: (e)=>{
                        const v = e.target.value;
                        if (v === "true") onChange(true);
                        else if (v === "false") onChange(false);
                        else onChange(v);
                    },
                    className: "rounded-lg border px-3 py-2 text-sm",
                    style: {
                        borderColor: "rgba(0,0,0,0.1)",
                        color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                    },
                    children: type === "boolean" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "true",
                                children: "Yes"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 43,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "false",
                                children: "No"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : options?.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: opt,
                            children: opt
                        }, opt, false, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                            lineNumber: 48,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this);
    }
    if (type === "numeric") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "flex flex-col gap-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs",
                    style: {
                        color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                    },
                    children: text
                }, void 0, false, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                    lineNumber: 61,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "number",
                    value: value !== undefined ? String(value) : "",
                    onChange: (e)=>onChange(parseFloat(e.target.value) || 0),
                    className: "rounded-lg border px-3 py-2",
                    style: {
                        borderColor: "rgba(0,0,0,0.1)",
                        color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                    }
                }, void 0, false, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                    lineNumber: 64,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
            lineNumber: 60,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "flex flex-col gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs",
                style: {
                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                },
                children: text
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                value: value !== undefined ? String(value) : "",
                onChange: (e)=>onChange(e.target.value),
                className: "rounded-lg border px-3 py-2",
                style: {
                    borderColor: "rgba(0,0,0,0.1)",
                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                }
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
_c = QuestionInput;
function ParameterPanel() {
    _s();
    const { request, response, runGeneration, isLoading, error, setSetback, setNumCandidates, setPlotPoints, setUserAnswers } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    const { setMode, setShowParameterPanel, draftPolygon } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const [localSetback, setLocalSetback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(String(request.setback_m));
    const [localCandidates, setLocalCandidates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(String(request.num_candidates));
    const [questionAnswers, setQuestionAnswers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const pendingQuestions = response?.pending_questions ?? [];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ParameterPanel.useEffect": ()=>{
            const questions = response?.pending_questions ?? [];
            if (questions.length === 0) return;
            setQuestionAnswers({
                "ParameterPanel.useEffect": (prev)=>{
                    const next = {
                        ...prev
                    };
                    let changed = false;
                    for (const q of questions){
                        if (prev[q.id] === undefined) {
                            next[q.id] = q.default ?? q.options?.[0] ?? "";
                            changed = true;
                        }
                    }
                    return changed ? next : prev;
                }
            }["ParameterPanel.useEffect"]);
        }
    }["ParameterPanel.useEffect"], [
        response?.pending_questions
    ]);
    const handleQuestionChange = (id, value)=>{
        setQuestionAnswers((prev)=>({
                ...prev,
                [id]: value
            }));
    };
    const handleGenerate = async ()=>{
        const PIXELS_PER_METER = 10;
        const meterPoints = draftPolygon.map(([px, py])=>[
                px / PIXELS_PER_METER,
                py / PIXELS_PER_METER
            ]);
        setPlotPoints(meterPoints);
        setSetback(Number(localSetback));
        setNumCandidates(Number(localCandidates));
        setUserAnswers(Object.keys(questionAnswers).length ? questionAnswers : null);
        await runGeneration();
        const state = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"].getState();
        if (state.error) return;
        if (!state.response?.candidates?.length) {
            const pending = state.response?.pending_questions;
            if (pending?.length) {
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"].setState({
                    error: "Please answer the questions above, or reduce setback and try again."
                });
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"].setState({
                    error: "No layouts could fit. Draw a larger plot (aim for ~20×15 m or bigger) or reduce setback."
                });
            }
            return;
        }
        setMode("plan");
        setShowParameterPanel(false);
    };
    const canGenerate = draftPolygon.length >= 3;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex w-80 flex-col overflow-hidden rounded-r-lg",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between border-b px-6 py-4",
                style: {
                    borderColor: "rgba(0,0,0,0.06)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold uppercase",
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                        },
                        children: "Parameters"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowParameterPanel(false),
                        className: "text-lg leading-none",
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                        },
                        children: "×"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 195,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 flex-col gap-4 overflow-auto p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex flex-col gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs",
                                style: {
                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                                },
                                children: "Setback (m)"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: localSetback,
                                onChange: (e)=>setLocalSetback(e.target.value),
                                step: "0.1",
                                min: "0",
                                className: "rounded-lg border px-3 py-2",
                                style: {
                                    borderColor: "rgba(0,0,0,0.1)",
                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex flex-col gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs",
                                style: {
                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                                },
                                children: "Layout variants"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 226,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: localCandidates,
                                onChange: (e)=>setLocalCandidates(e.target.value),
                                min: "1",
                                max: "20",
                                className: "rounded-lg border px-3 py-2",
                                style: {
                                    borderColor: "rgba(0,0,0,0.1)",
                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 232,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 225,
                        columnNumber: 9
                    }, this),
                    pendingQuestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium",
                                style: {
                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                                },
                                children: "Answer these to generate a layout"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                lineNumber: 247,
                                columnNumber: 13
                            }, this),
                            pendingQuestions.map((q)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuestionInput, {
                                    question: q,
                                    value: questionAnswers[q.id],
                                    onChange: (v)=>handleQuestionChange(q.id, v)
                                }, q.id, false, {
                                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg px-3 py-2 text-xs",
                        style: {
                            background: "rgba(192,57,43,0.1)",
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ERROR
                        },
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 264,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>void handleGenerate(),
                        disabled: !canGenerate || isLoading,
                        className: "mt-4 rounded-lg px-4 py-3 text-sm font-medium uppercase",
                        style: {
                            background: canGenerate && !isLoading ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT : "#ccc",
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE
                        },
                        children: isLoading ? "Generating…" : "Generate Plan"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx",
        lineNumber: 178,
        columnNumber: 5
    }, this);
}
_s(ParameterPanel, "c5mD3HV4Ov8VaKqERoNYvgnz5VU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c1 = ParameterPanel;
var _c, _c1;
__turbopack_context__.k.register(_c, "QuestionInput");
__turbopack_context__.k.register(_c1, "ParameterPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DraftMode",
    ()=>DraftMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$panels$2f$ParameterPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/panels/ParameterPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const GRID_SIZE = 10;
const SNAP_RADIUS = 12;
const POINT_RADIUS = 5;
const ACCENT = "#2A5FE6";
const GRID_COLOR = "#E0E0DC";
const GRID_MAJOR_COLOR = "#C8C8C4";
function DraftMode({ width, height }) {
    _s();
    const { draftPolygon, addDraftVertex, setShowParameterPanel } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const [closed, setClosed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleCanvasClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DraftMode.useCallback[handleCanvasClick]": (e)=>{
            if (closed) return;
            if (e.button !== 0) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldPt = [
                x,
                y
            ];
            if (draftPolygon.length >= 3) {
                const first = draftPolygon[0];
                const d = Math.hypot(x - first[0], y - first[1]);
                if (d < SNAP_RADIUS) {
                    setClosed(true);
                    setShowParameterPanel(true);
                    return;
                }
            }
            addDraftVertex(worldPt);
        }
    }["DraftMode.useCallback[handleCanvasClick]"], [
        closed,
        draftPolygon,
        addDraftVertex,
        setShowParameterPanel
    ]);
    const handleRightClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DraftMode.useCallback[handleRightClick]": (e)=>{
            e.preventDefault();
            if (draftPolygon.length > 0) {
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"].getState().removeLastDraftVertex();
            }
        }
    }["DraftMode.useCallback[handleRightClick]"], [
        draftPolygon.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DraftMode.useEffect": ()=>{
            const onKey = {
                "DraftMode.useEffect.onKey": (e)=>{
                    if (e.key === "Escape" && draftPolygon.length > 0) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"].getState().removeLastDraftVertex();
                    }
                }
            }["DraftMode.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "DraftMode.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["DraftMode.useEffect"];
        }
    }["DraftMode.useEffect"], [
        draftPolygon.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DraftMode.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Clear
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#FAFAF8";
            ctx.fillRect(0, 0, width, height);
            // Grid
            for(let x = 0; x <= width; x += GRID_SIZE){
                const isMajor = Math.round(x / GRID_SIZE) % 5 === 0;
                ctx.strokeStyle = isMajor ? GRID_MAJOR_COLOR : GRID_COLOR;
                ctx.lineWidth = isMajor ? 1 : 0.5;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for(let y = 0; y <= height; y += GRID_SIZE){
                const isMajor = Math.round(y / GRID_SIZE) % 5 === 0;
                ctx.strokeStyle = isMajor ? GRID_MAJOR_COLOR : GRID_COLOR;
                ctx.lineWidth = isMajor ? 1 : 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            // Polygon lines
            if (draftPolygon.length >= 2) {
                ctx.strokeStyle = ACCENT;
                ctx.lineWidth = 2;
                ctx.setLineDash(closed ? [] : [
                    6,
                    4
                ]);
                ctx.beginPath();
                ctx.moveTo(draftPolygon[0][0], draftPolygon[0][1]);
                for(let i = 1; i < draftPolygon.length; i++){
                    ctx.lineTo(draftPolygon[i][0], draftPolygon[i][1]);
                }
                if (closed) {
                    ctx.closePath();
                    ctx.fillStyle = "rgba(42, 95, 230, 0.05)";
                    ctx.fill();
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
            // Vertices
            for(let i = 0; i < draftPolygon.length; i++){
                const [px, py] = draftPolygon[i];
                ctx.fillStyle = ACCENT;
                ctx.beginPath();
                ctx.arc(px, py, POINT_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                if (i === 0 && draftPolygon.length >= 3 && !closed) {
                    ctx.strokeStyle = ACCENT;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(px, py, SNAP_RADIUS, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }["DraftMode.useEffect"], [
        width,
        height,
        draftPolygon,
        closed
    ]);
    const showParameterPanel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])({
        "DraftMode.useStudioStore[showParameterPanel]": (s)=>s.showParameterPanel
    }["DraftMode.useStudioStore[showParameterPanel]"]);
    const clearDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])({
        "DraftMode.useStudioStore[clearDraft]": (s)=>s.clearDraft
    }["DraftMode.useStudioStore[clearDraft]"]);
    const panelVisible = showParameterPanel && closed;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: "relative",
            width: "100%",
            height: "100%"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                style: {
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: closed ? "default" : "crosshair",
                    display: "block"
                },
                onClick: handleCanvasClick,
                onContextMenu: handleRightClick
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            draftPolygon.length > 0 && !panelVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>{
                    clearDraft();
                    setClosed(false);
                },
                style: {
                    position: "absolute",
                    left: 16,
                    top: 16,
                    zIndex: 10,
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "#333",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    cursor: "pointer"
                },
                children: "Clear"
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx",
                lineNumber: 162,
                columnNumber: 9
            }, this),
            panelVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 20
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$panels$2f$ParameterPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ParameterPanel"], {}, void 0, false, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx",
                    lineNumber: 197,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx",
                lineNumber: 188,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx",
        lineNumber: 149,
        columnNumber: 5
    }, this);
}
_s(DraftMode, "eDPLkV1s2EZ2FSVPlizeYEMSh7M=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = DraftMode;
var _c;
__turbopack_context__.k.register(_c, "DraftMode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AIInsightsPanel",
    ()=>AIInsightsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AIInsightsPanel() {
    _s();
    const { analysis, analysisLoading, runAnalysis, request } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    const { setShowAIPanel } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const handleAnalyze = ()=>{
        void runAnalysis(request.plot.gate_direction);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex w-80 flex-col overflow-hidden rounded-r-lg",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between border-b px-6 py-4",
                style: {
                    borderColor: "rgba(0,0,0,0.06)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold uppercase",
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                        },
                        children: "AI Insights"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowAIPanel(false),
                        className: "text-lg leading-none",
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                        },
                        children: "×"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 flex-col gap-4 overflow-auto p-6",
                children: !analysis ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm",
                            style: {
                                color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY,
                                lineHeight: 1.6
                            },
                            children: "Get architectural feedback on zoning, privacy, and room relationships."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                            lineNumber: 46,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: handleAnalyze,
                            disabled: analysisLoading,
                            className: "rounded-lg px-4 py-3 text-sm font-medium uppercase",
                            style: {
                                background: analysisLoading ? "#ccc" : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT,
                                color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE
                            },
                            children: analysisLoading ? "Analyzing…" : "AI Review"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                            lineNumber: 53,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm",
                    style: {
                        color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY,
                        lineHeight: 1.7,
                        fontSize: 14
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mb-4",
                            children: analysis.summary
                        }, void 0, false, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                            lineNumber: 75,
                            columnNumber: 13
                        }, this),
                        analysis.strengths.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "mb-2 font-semibold uppercase text-xs",
                                    children: "Strengths"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                    lineNumber: 78,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "list-disc pl-4 space-y-1",
                                    children: analysis.strengths.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: s
                                        }, i, false, {
                                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                            lineNumber: 83,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                    lineNumber: 81,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                            lineNumber: 77,
                            columnNumber: 15
                        }, this),
                        analysis.suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "mb-2 font-semibold uppercase text-xs",
                                    children: "Suggestions"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "list-disc pl-4 space-y-1",
                                    children: analysis.suggestions.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: s
                                        }, i, false, {
                                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                            lineNumber: 95,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                                    lineNumber: 93,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                            lineNumber: 89,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                    lineNumber: 67,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(AIInsightsPanel, "ZGcCJ3oKwVsNFzdlH4tM0XRkHE0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"]
    ];
});
_c = AIInsightsPanel;
var _c;
__turbopack_context__.k.register(_c, "AIInsightsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlanMode",
    ()=>PlanMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$panels$2f$AIInsightsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/panels/AIInsightsPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const PIXELS_PER_METER = 10;
const PAD = 24;
const ROOM_COLORS = {
    public: "rgba(74, 144, 226, 0.35)",
    private: "rgba(142, 98, 198, 0.35)",
    service: "rgba(96, 165, 96, 0.35)"
};
function getRoomColor(category) {
    return ROOM_COLORS[category] ?? "rgba(128, 128, 128, 0.35)";
}
function drawPolygon(ctx, points, toPx, fill, stroke, lineWidth = 1) {
    if (points.length < 2) return;
    ctx.beginPath();
    const [fx, fy] = toPx(points[0][0], points[0][1]);
    ctx.moveTo(fx, fy);
    for(let i = 1; i < points.length; i++){
        const [px, py] = toPx(points[i][0], points[i][1]);
        ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}
function PlanMode({ width, height }) {
    _s();
    const { showAIPanel, setShowAIPanel } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const { request, response, editedCandidate, selectedCandidateId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasLayout = !!response?.candidates?.length;
    const candidate = editedCandidate ?? response?.candidates?.find((c)=>c.candidate_id === selectedCandidateId) ?? response?.candidates?.[0] ?? null ?? null;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PlanMode.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas || !hasLayout || !candidate || !response) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const plotPoints = request.plot.points;
            const buildablePolygon = response.buildable_polygon;
            const rooms = candidate.rooms;
            const allPoints = [
                ...plotPoints,
                ...buildablePolygon,
                ...rooms.flatMap({
                    "PlanMode.useEffect": (r)=>r.polygon
                }["PlanMode.useEffect"])
            ];
            if (allPoints.length === 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const [x, y] of allPoints){
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            const contentW = (maxX - minX) * PIXELS_PER_METER;
            const contentH = (maxY - minY) * PIXELS_PER_METER;
            const scale = Math.min((width - 2 * PAD) / contentW, (height - 2 * PAD) / contentH);
            const tx = PAD + (width - 2 * PAD - contentW * scale) / 2 - minX * PIXELS_PER_METER * scale;
            const ty = PAD + (height - 2 * PAD - contentH * scale) / 2 - minY * PIXELS_PER_METER * scale;
            const toPx = {
                "PlanMode.useEffect.toPx": (mx, my)=>[
                        mx * PIXELS_PER_METER * scale + tx,
                        my * PIXELS_PER_METER * scale + ty
                    ]
            }["PlanMode.useEffect.toPx"];
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].CANVAS_WHITE;
            ctx.fillRect(0, 0, width, height);
            // Plot boundary
            drawPolygon(ctx, plotPoints, toPx, "rgba(42, 95, 230, 0.06)", __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].ACCENT, 2);
            // Buildable area
            drawPolygon(ctx, buildablePolygon, toPx, "rgba(200, 200, 200, 0.2)", "#B0B0B0", 1);
            // Rooms
            for (const room of rooms){
                const fill = getRoomColor(room.category);
                drawPolygon(ctx, room.polygon, toPx, fill, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].WALL_INTERIOR, 1.5);
            }
            // Room labels
            ctx.font = "11px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (const room of rooms){
                const [cx, cy] = room.centroid;
                const [px, py] = toPx(cx, cy);
                ctx.fillStyle = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY;
                ctx.fillText(room.name, px, py);
            }
        }
    }["PlanMode.useEffect"], [
        width,
        height,
        hasLayout,
        candidate,
        response,
        request.plot.points
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex h-full w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 items-center justify-center overflow-hidden",
                style: {
                    background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].CANVAS_WHITE
                },
                children: [
                    hasLayout ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                        ref: canvasRef,
                        style: {
                            width: `${width}px`,
                            height: `${height}px`,
                            display: "block"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY,
                            fontSize: 14
                        },
                        children: "No layout generated yet. Draw a plot in Draft mode first."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
                        lineNumber: 179,
                        columnNumber: 11
                    }, this),
                    !showAIPanel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowAIPanel(true),
                        className: "absolute right-0 top-1/2 -translate-y-1/2 -rotate-90 origin-right rounded-t px-2 py-1 text-xs font-medium",
                        style: {
                            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].PAPER_WHITE,
                            color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY,
                            boxShadow: "0 1px 8px rgba(0,0,0,0.07)"
                        },
                        children: "AI Insights"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
                        lineNumber: 184,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this),
            showAIPanel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$panels$2f$AIInsightsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AIInsightsPanel"], {}, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
                lineNumber: 198,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx",
        lineNumber: 164,
        columnNumber: 5
    }, this);
}
_s(PlanMode, "OSuaGp8/AGpfSR2CxD8zyyGLYp8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"]
    ];
});
_c = PlanMode;
var _c;
__turbopack_context__.k.register(_c, "PlanMode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdvancedOverlay",
    ()=>AdvancedOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AdvancedOverlay() {
    _s();
    const { isAdvancedMode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const { request, response, editedCandidate, selectedCandidateId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    if (!isAdvancedMode) return null;
    const candidate = editedCandidate ?? response?.candidates.find((c)=>c.candidate_id === selectedCandidateId) ?? response?.candidates[0] ?? null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute right-0 top-12 z-50 flex w-80 flex-col overflow-auto rounded-r-lg border-l p-4",
        style: {
            background: "#F5F3EE",
            borderColor: "rgba(0,0,0,0.08)",
            fontFamily: "monospace",
            fontSize: 11,
            maxHeight: "calc(100vh - 96px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "mb-2 font-semibold",
                style: {
                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_PRIMARY
                },
                children: "Engine"
            }, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-1",
                style: {
                    color: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].LABEL_SECONDARY
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            "Seed: ",
                            request.generation_seed
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            "Candidates: ",
                            response?.candidates.length ?? 0
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    candidate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Selected: #",
                                    candidate.candidate_id
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                                lineNumber: 38,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Pareto rank: ",
                                    candidate.scores.pareto_rank ?? "—"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                                lineNumber: 39,
                                columnNumber: 13
                            }, this),
                            candidate.scores.dimension_scores && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-1 font-semibold",
                                        children: "Scores:"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                                        lineNumber: 42,
                                        columnNumber: 17
                                    }, this),
                                    Object.entries(candidate.scores.dimension_scores).map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                k,
                                                ": ",
                                                typeof v === "number" ? v.toFixed(3) : v
                                            ]
                                        }, k, true, {
                                            fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                                            lineNumber: 45,
                                            columnNumber: 21
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                                lineNumber: 41,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_s(AdvancedOverlay, "7JhIq7i257EdRsuxMyZm9Hqxyes=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"]
    ];
});
_c = AdvancedOverlay;
var _c;
__turbopack_context__.k.register(_c, "AdvancedOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StudioLayout",
    ()=>StudioLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$TopBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/controls/TopBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$LeftRail$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/controls/LeftRail.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$BottomBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/controls/BottomBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$DraftMode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/modes/DraftMode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$PlanMode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/modes/PlanMode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$AdvancedOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/modes/AdvancedOverlay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/studioStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/store/layoutStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
function StudioLayout() {
    _s();
    const { mode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"])();
    const { response } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"])();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [size, setSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        width: 800,
        height: 600
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StudioLayout.useEffect": ()=>{
            const el = containerRef.current;
            if (!el) return;
            const update = {
                "StudioLayout.useEffect.update": ()=>{
                    const w = el.offsetWidth;
                    const h = el.offsetHeight;
                    if (w > 0 && h > 0) {
                        setSize({
                            width: w,
                            height: h
                        });
                    }
                }
            }["StudioLayout.useEffect.update"];
            update();
            const ro = new ResizeObserver(update);
            ro.observe(el);
            return ({
                "StudioLayout.useEffect": ()=>ro.disconnect()
            })["StudioLayout.useEffect"];
        }
    }["StudioLayout.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StudioLayout.useEffect": ()=>{
            const onKey = {
                "StudioLayout.useEffect.onKey": (e)=>{
                    if (e.ctrlKey && e.shiftKey && e.key === "D") {
                        e.preventDefault();
                        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"].getState().toggleAdvancedMode();
                    }
                }
            }["StudioLayout.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "StudioLayout.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["StudioLayout.useEffect"];
        }
    }["StudioLayout.useEffect"], []);
    const candidate = response?.candidates[0] ?? null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col overflow-hidden",
        style: {
            background: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].CANVAS_WHITE,
            height: "100vh",
            width: "100vw"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$TopBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TopBar"], {}, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1",
                style: {
                    minHeight: 0,
                    overflow: "hidden"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$LeftRail$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LeftRail"], {
                        candidate: candidate
                    }, void 0, false, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: containerRef,
                        style: {
                            flex: 1,
                            minHeight: 0,
                            minWidth: 0,
                            position: "relative",
                            overflow: "hidden"
                        },
                        children: [
                            mode === "draft" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$DraftMode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DraftMode"], {
                                width: size.width,
                                height: size.height
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                                lineNumber: 62,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$PlanMode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlanMode"], {
                                width: size.width,
                                height: size.height
                            }, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$modes$2f$AdvancedOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdvancedOverlay"], {}, void 0, false, {
                                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$studio$2f$controls$2f$BottomBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BottomBar"], {}, void 0, false, {
                fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_s(StudioLayout, "LrEFkDJLFbTAYeg6AD0YHp+ZcEg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$studioStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStudioStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$New__folder__$28$3$292f$frontend$2f$src$2f$store$2f$layoutStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutStore"]
    ];
});
_c = StudioLayout;
var _c;
__turbopack_context__.k.register(_c, "StudioLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/New folder (3)/frontend/src/studio/StudioLayout.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=Desktop_New%20folder%20%283%29_frontend_src_91701c25._.js.map