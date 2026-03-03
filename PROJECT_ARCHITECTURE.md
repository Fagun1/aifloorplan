

```markdown
# PROJECT_ARCHITECTURE.md

# AI Architectural Planning & VR Layout Platform

**Version:** 2.0.0
**Classification:** Internal — Engineering Architecture Document
**Last Updated:** 2025-07-10
**Authors:** Platform Architecture Team
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [High-Level Component Diagram](#3-high-level-component-diagram)
4. [Detailed Backend Architecture](#4-detailed-backend-architecture)
5. [Detailed Frontend Architecture](#5-detailed-frontend-architecture)
6. [Geometry Engine Design](#6-geometry-engine-design)
7. [Layout Optimization Engine Design](#7-layout-optimization-engine-design)
8. [Constraint Engine Design](#8-constraint-engine-design)
9. [Scoring System Design](#9-scoring-system-design)
10. [Dynamic Question Engine Design](#10-dynamic-question-engine-design)
11. [Multi-Floor Architecture Design](#11-multi-floor-architecture-design)
12. [Interactive Editor Design](#12-interactive-editor-design)
13. [VR Mode Architecture (Three.js)](#13-vr-mode-architecture-threejs)
14. [Furniture Placement Logic](#14-furniture-placement-logic)
15. [Database Schema](#15-database-schema)
16. [API Endpoint Design](#16-api-endpoint-design)
17. [Data Flow Example](#17-data-flow-example)
18. [Scalability Plan](#18-scalability-plan)
19. [Future AI Expansion](#19-future-ai-expansion)
20. [Development Phases](#20-development-phases)

---

## 1. Executive Summary

This document defines the complete technical architecture for the **AI Architectural Planning & VR Layout Platform** — a full-stack system that transforms irregular polygon plot inputs into optimized, multi-floor architectural layouts with interactive editing and immersive VR walkthroughs.

### Core Value Proposition

Traditional architectural planning demands weeks of expert labor, iterative client feedback, and expensive CAD tooling. This platform compresses that cycle to minutes by coupling constraint-based optimization engines with LLM-powered intelligent questioning, heuristic scoring, and real-time 3D visualization.

### Key Technical Differentiators

| Capability | Implementation |
|---|---|
| Irregular polygon handling | Computational geometry engine with triangulation, decomposition, and Minkowski operations |
| Multi-candidate generation | Tree-search layout generation with parallel evaluation |
| Intelligent follow-ups | LLM-driven dynamic question engine with constraint graph awareness |
| Real-time editing | Canvas-based 2D editor with snapping, collision detection, and live constraint validation |
| VR walkthrough | Three.js scene graph with procedural furniture placement and stylized rendering |
| Multi-floor coherence | Structural alignment engine enforcing vertical load paths, stairwell continuity, and shaft alignment |

### Target Scale (18-month horizon)

- 50,000 concurrent users
- < 3 second layout generation (P95)
- < 500ms editor interaction latency
- 60 FPS VR mode on mid-tier hardware
- 99.9% API availability

---

## 2. System Architecture Overview

The platform follows a **modular microservice-adjacent monolith** pattern — deployed as a single FastAPI application internally organized into strictly bounded engine modules, each with its own interface contract. This avoids premature microservice complexity while enabling future extraction.

### Architectural Principles

1. **Engine Isolation** — Each computational engine (geometry, constraint, layout, scoring, VR) communicates through typed data contracts, never shared mutable state.
2. **Pipeline Composition** — Layout generation is a directed acyclic pipeline: `Input → Geometry → Questions → Constraints → Generation → Scoring → Selection → VR`.
3. **Optimistic Frontend** — The editor applies changes locally with client-side constraint checking, syncing asynchronously.
4. **Progressive Enhancement** — 2D layouts render instantly; VR scenes load progressively with LOD.
5. **Deterministic Reproducibility** — Every layout generation is seeded and version-stamped for auditability.

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | SSR for initial load, RSC for data-heavy pages |
| 2D Canvas | Konva.js | High-performance 2D scene graph with hit detection |
| 3D / VR | Three.js + React Three Fiber | Declarative 3D with React integration |
| State Management | Zustand + Immer | Immutable state with minimal boilerplate |
| Backend Framework | Python 3.12 + FastAPI | Async-native, typed, high-throughput |
| Geometry | Shapely + custom extensions | Industrial-grade computational geometry |
| AI / LLM | OpenAI GPT-4o / Claude via LiteLLM | Provider-agnostic LLM abstraction |
| Database | PostgreSQL 16 + PostGIS | Spatial query support native |
| Cache | Redis 7 (Valkey compatible) | Layout candidate caching, session state |
| Task Queue | Celery + Redis broker | Async layout generation jobs |
| Object Storage | S3 / MinIO | VR assets, exported PDFs, thumbnails |
| Auth | NextAuth.js + JWT | Session management with OAuth providers |
| Deployment | Docker Compose → Kubernetes | Progressive containerization |
| CI/CD | GitHub Actions | Test, lint, build, deploy pipeline |

---

## 3. High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────────┐   │
│  │  Plot Input   │  │  Interactive 2D  │  │   VR Walkthrough Mode   │   │
│  │  Interface    │  │  Layout Editor   │  │   (Three.js / R3F)      │   │
│  │  (Konva.js)   │  │  (Konva.js)      │  │                         │   │
│  └──────┬───────┘  └────────┬─────────┘  └────────────┬────────────┘   │
│         │                   │                          │                │
│  ┌──────┴───────────────────┴──────────────────────────┴────────────┐   │
│  │                    Zustand State Manager                          │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────────┐  │   │
│  │  │ Plot    │ │ Layout   │ │ Floor     │ │ VR Scene State     │  │   │
│  │  │ Store   │ │ Store    │ │ Store     │ │                    │  │   │
│  │  └─────────┘ └──────────┘ └───────────┘ └────────────────────┘  │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
│                             │                                           │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Application                            │   │
│  │                                                                  │   │
│  │  /api/v1/plots        POST, GET, PATCH, DELETE                   │   │
│  │  /api/v1/layouts      POST (generate), GET, PATCH               │   │
│  │  /api/v1/questions    GET (dynamic), POST (answers)              │   │
│  │  /api/v1/floors       GET, PATCH                                 │   │
│  │  /api/v1/vr/scene     GET (room scene data)                     │   │
│  │  /api/v1/export       POST (PDF, DXF, PNG)                      │   │
│  │  /ws/editor           WebSocket (real-time editor sync)          │   │
│  └──────────┬───────────────────────────────────────────────────────┘   │
│             │                                                           │
└─────────────┼───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENGINE LAYER                                     │
│                                                                         │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────────┐   │
│  │ Geometry   │ │ Constraint   │ │ Layout     │ │ Scoring         │   │
│  │ Engine     │ │ Engine       │ │ Generator  │ │ Engine          │   │
│  │            │ │              │ │            │ │                 │   │
│  │ • Polygon  │ │ • Rule DB    │ │ • Tree     │ │ • Multi-obj    │   │
│  │   valid.   │ │ • Vastu/     │ │   search   │ │   heuristics   │   │
│  │ • Decomp.  │ │   Feng Shui  │ │ • Space    │ │ • Pareto       │   │
│  │ • Buffer   │ │ • Building   │ │   partition│ │   ranking      │   │
│  │ • Setback  │ │   codes      │ │ • Packing  │ │ • Penalty      │   │
│  │ • Area     │ │ • User prefs │ │   algo     │ │   functions    │   │
│  └─────┬──────┘ └──────┬───────┘ └─────┬──────┘ └───────┬─────────┘   │
│        │               │               │                │              │
│  ┌─────┴───────────────┴───────────────┴────────────────┴──────────┐   │
│  │                    Engine Orchestrator                            │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────┐ ┌────────┴────────┐ ┌────────────────────────────┐   │
│  │ Dynamic      │ │ VR Scene        │ │ Furniture Placement        │   │
│  │ Question     │ │ Generator       │ │ Engine                     │   │
│  │ Engine (LLM) │ │ (Three.js data) │ │                            │   │
│  └──────────────┘ └─────────────────┘ └────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ PostgreSQL   │  │ Redis        │  │ S3 / MinIO   │  │ Vector DB │  │
│  │ + PostGIS    │  │ Cache/Queue  │  │ Assets       │  │ (future)  │  │
│  │              │  │              │  │              │  │           │  │
│  │ • Users      │  │ • Session    │  │ • 3D Models  │  │ • Layout  │  │
│  │ • Plots      │  │ • Layout     │  │ • Textures   │  │   embed.  │  │
│  │ • Layouts    │  │   cache      │  │ • Exports    │  │ • Search  │  │
│  │ • Rooms      │  │ • Task queue │  │ • Thumbnails │  │           │  │
│  │ • Furniture  │  │              │  │              │  │           │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Backend Architecture

### 4.1 Project Structure

```
backend/
├── main.py                          # FastAPI app factory
├── config/
│   ├── settings.py                  # Pydantic BaseSettings
│   ├── constants.py                 # System constants
│   └── logging.py                   # Structured logging config
├── api/
│   ├── v1/
│   │   ├── routes/
│   │   │   ├── plots.py
│   │   │   ├── layouts.py
│   │   │   ├── questions.py
│   │   │   ├── floors.py
│   │   │   ├── vr.py
│   │   │   ├── editor.py           # WebSocket endpoint
│   │   │   └── export.py
│   │   ├── dependencies.py
│   │   └── middleware.py
│   └── schemas/
│       ├── plot.py                  # Pydantic request/response models
│       ├── layout.py
│       ├── room.py
│       ├── question.py
│       ├── vr_scene.py
│       └── common.py
├── engines/
│   ├── geometry/
│   │   ├── __init__.py
│   │   ├── polygon.py              # Polygon operations
│   │   ├── decomposition.py        # Convex decomposition
│   │   ├── setback.py              # Setback/buffer calculation
│   │   ├── triangulation.py        # Ear-clipping, Delaunay
│   │   ├── validation.py           # Geometric validation
│   │   └── transforms.py           # Affine transforms
│   ├── constraints/
│   │   ├── __init__.py
│   │   ├── building_codes.py       # Regulatory constraints
│   │   ├── spatial_rules.py        # Adjacency, separation
│   │   ├── structural.py           # Load-bearing, shaft alignment
│   │   ├── user_preferences.py     # User-specified constraints
│   │   ├── rule_engine.py          # Forward-chaining rule engine
│   │   └── validator.py            # Constraint satisfaction checker
│   ├── layout/
│   │   ├── __init__.py
│   │   ├── generator.py            # Main layout generation
│   │   ├── space_partitioner.py    # Recursive space partitioning
│   │   ├── packing.py              # Bin-packing algorithms
│   │   ├── corridor.py             # Corridor/hallway generation
│   │   ├── candidate_pool.py       # Candidate management
│   │   └── search.py               # Tree search strategies
│   ├── scoring/
│   │   ├── __init__.py
│   │   ├── scorer.py               # Multi-objective scorer
│   │   ├── metrics.py              # Individual metric calculations
│   │   ├── weights.py              # Dynamic weight configuration
│   │   └── pareto.py               # Pareto front computation
│   ├── questions/
│   │   ├── __init__.py
│   │   ├── question_engine.py      # Dynamic question generator
│   │   ├── context_builder.py      # Constraint graph → LLM context
│   │   ├── answer_processor.py     # Answer → constraint mapper
│   │   └── templates.py            # Question templates
│   ├── vr/
│   │   ├── __init__.py
│   │   ├── scene_builder.py        # Three.js scene data assembly
│   │   ├── room_renderer.py        # Room geometry → 3D mesh data
│   │   ├── material_mapper.py      # Room type → material palette
│   │   └── lighting.py             # Lighting rig configuration
│   ├── furniture/
│   │   ├── __init__.py
│   │   ├── placer.py               # Furniture placement algorithm
│   │   ├── catalog.py              # Furniture database interface
│   │   ├── rules.py                # Placement rules per room type
│   │   └── collision.py            # Furniture collision detection
│   └── orchestrator/
│       ├── __init__.py
│       ├── pipeline.py             # DAG-based engine pipeline
│       └── context.py              # Shared pipeline context object
├── models/
│   ├── user.py                      # SQLAlchemy ORM models
│   ├── plot.py
│   ├── layout.py
│   ├── room.py
│   ├── floor.py
│   ├── furniture_item.py
│   └── question_session.py
├── services/
│   ├── llm_service.py              # LiteLLM abstraction
│   ├── cache_service.py            # Redis operations
│   ├── storage_service.py          # S3/MinIO operations
│   ├── export_service.py           # PDF/DXF/PNG generation
│   └── notification_service.py     # WebSocket push
├── tasks/
│   ├── layout_generation.py        # Celery async tasks
│   ├── vr_scene_build.py
│   └── export_generation.py
├── utils/
│   ├── math_utils.py
│   ├── geo_utils.py
│   └── serializers.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── alembic/                         # Database migrations
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### 4.2 Engine Orchestrator Pipeline

The orchestrator coordinates all engines through a typed pipeline context:

```python
# engines/orchestrator/pipeline.py

from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class PipelineStage(Enum):
    GEOMETRY_VALIDATION = "geometry_validation"
    SETBACK_COMPUTATION = "setback_computation"
    QUESTION_GENERATION = "question_generation"
    CONSTRAINT_COMPILATION = "constraint_compilation"
    LAYOUT_GENERATION = "layout_generation"
    SCORING = "scoring"
    SELECTION = "selection"
    MULTI_FLOOR_ALIGNMENT = "multi_floor_alignment"
    VR_SCENE_GENERATION = "vr_scene_generation"

@dataclass
class PipelineContext:
    project_id: str
    user_id: str
    raw_polygon: List[tuple[float, float]]
    gate_direction: str
    road_adjacency: List[str]
    parking_config: dict
    num_floors: int
    room_requirements: List[dict]
    
    # Populated by pipeline stages
    validated_polygon: Optional[object] = None
    buildable_area: Optional[object] = None
    setback_polygon: Optional[object] = None
    compiled_constraints: List[dict] = field(default_factory=list)
    pending_questions: List[dict] = field(default_factory=list)
    user_answers: dict = field(default_factory=dict)
    layout_candidates: List[dict] = field(default_factory=list)
    scored_candidates: List[dict] = field(default_factory=list)
    selected_layout: Optional[dict] = None
    floor_layouts: dict = field(default_factory=dict)
    vr_scenes: dict = field(default_factory=dict)
    
    # Metadata
    generation_seed: int = 42
    stage_timings: dict = field(default_factory=dict)
    errors: List[dict] = field(default_factory=list)


class LayoutPipeline:
    def __init__(self, engines: dict):
        self.geometry = engines["geometry"]
        self.constraints = engines["constraints"]
        self.questions = engines["questions"]
        self.layout = engines["layout"]
        self.scoring = engines["scoring"]
        self.vr = engines["vr"]
        self.furniture = engines["furniture"]
    
    async def execute(self, ctx: PipelineContext) -> PipelineContext:
        stages = [
            (PipelineStage.GEOMETRY_VALIDATION, self._validate_geometry),
            (PipelineStage.SETBACK_COMPUTATION, self._compute_setbacks),
            (PipelineStage.QUESTION_GENERATION, self._generate_questions),
            (PipelineStage.CONSTRAINT_COMPILATION, self._compile_constraints),
            (PipelineStage.LAYOUT_GENERATION, self._generate_layouts),
            (PipelineStage.SCORING, self._score_candidates),
            (PipelineStage.SELECTION, self._select_best),
            (PipelineStage.MULTI_FLOOR_ALIGNMENT, self._align_floors),
            (PipelineStage.VR_SCENE_GENERATION, self._generate_vr),
        ]
        
        for stage, handler in stages:
            t_start = time.monotonic()
            try:
                ctx = await handler(ctx)
            except PipelineStageError as e:
                ctx.errors.append({"stage": stage.value, "error": str(e)})
                if e.fatal:
                    break
            ctx.stage_timings[stage.value] = time.monotonic() - t_start
        
        return ctx
```

### 4.3 Dependency Injection

```python
# api/v1/dependencies.py

from functools import lru_cache
from engines.geometry import GeometryEngine
from engines.constraints import ConstraintEngine
from engines.layout import LayoutGenerator
from engines.scoring import ScoringEngine
from engines.questions import QuestionEngine
from engines.vr import VRSceneBuilder
from engines.furniture import FurniturePlacer
from engines.orchestrator.pipeline import LayoutPipeline

@lru_cache()
def get_engine_registry():
    return {
        "geometry": GeometryEngine(),
        "constraints": ConstraintEngine(),
        "layout": LayoutGenerator(),
        "scoring": ScoringEngine(),
        "questions": QuestionEngine(),
        "vr": VRSceneBuilder(),
        "furniture": FurniturePlacer(),
    }

def get_pipeline() -> LayoutPipeline:
    return LayoutPipeline(get_engine_registry())
```

---

## 5. Detailed Frontend Architecture

### 5.1 Project Structure

```
frontend/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing / Dashboard
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Project overview
│   │   │   │   ├── editor/
│   │   │   │   │   └── page.tsx     # 2D Layout Editor
│   │   │   │   ├── vr/
│   │   │   │   │   └── page.tsx     # VR Walkthrough
│   │   │   │   └── export/
│   │   │   │       └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx         # New project wizard
│   │   └── api/                     # Next.js API routes (proxy)
│   ├── components/
│   │   ├── plot/
│   │   │   ├── PlotCanvas.tsx       # Konva canvas for polygon input
│   │   │   ├── PolygonDrawer.tsx    # Drawing tool
│   │   │   ├── GateSelector.tsx     # Gate direction picker
│   │   │   └── RoadAdjacencyPanel.tsx
│   │   ├── editor/
│   │   │   ├── LayoutCanvas.tsx     # Main 2D editor canvas
│   │   │   ├── RoomShape.tsx        # Individual room Konva component
│   │   │   ├── WallSegment.tsx      # Wall rendering
│   │   │   ├── DoorMarker.tsx
│   │   │   ├── WindowMarker.tsx
│   │   │   ├── FloorNavigator.tsx   # Floor up/down arrows
│   │   │   ├── ToolPalette.tsx      # Editor tools
│   │   │   ├── PropertyPanel.tsx    # Room property editor
│   │   │   ├── ConstraintOverlay.tsx # Visual constraint violations
│   │   │   └── MiniMap.tsx
│   │   ├── vr/
│   │   │   ├── VRScene.tsx          # R3F Canvas wrapper
│   │   │   ├── Room3D.tsx           # 3D room geometry
│   │   │   ├── FurnitureModel.tsx   # Individual furniture
│   │   │   ├── WallMaterial.tsx
│   │   │   ├── LightingRig.tsx
│   │   │   ├── CameraController.tsx # Orbit / first-person
│   │   │   └── VRTransition.tsx     # 2D → 3D transition animation
│   │   ├── questions/
│   │   │   ├── QuestionWizard.tsx   # Dynamic question flow
│   │   │   └── QuestionCard.tsx
│   │   ├── scoring/
│   │   │   ├── ScoreRadar.tsx       # Radar chart for layout scores
│   │   │   └── CandidateCompare.tsx # Side-by-side comparison
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingState.tsx
│   ├── stores/
│   │   ├── plotStore.ts             # Plot polygon state
│   │   ├── layoutStore.ts           # Layout + rooms state
│   │   ├── floorStore.ts            # Multi-floor state
│   │   ├── editorStore.ts           # Editor tools, selection
│   │   ├── vrStore.ts               # VR scene state
│   │   ├── questionStore.ts         # Question flow state
│   │   └── projectStore.ts          # Project-level state
│   ├── hooks/
│   │   ├── usePolygonDraw.ts
│   │   ├── useLayoutGeneration.ts
│   │   ├── useFloorNavigation.ts
│   │   ├── useRoomDrag.ts
│   │   ├── useConstraintValidation.ts
│   │   ├── useVRTransition.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   ├── api.ts                   # Axios/fetch wrapper
│   │   ├── geometry.ts              # Client-side geometry utils
│   │   ├── constraints.ts           # Client-side constraint checks
│   │   ├── scoring.ts               # Client-side score preview
│   │   └── constants.ts
│   ├── types/
│   │   ├── plot.ts
│   │   ├── layout.ts
│   │   ├── room.ts
│   │   ├── vr.ts
│   │   └── api.ts
│   └── assets/
│       ├── models/                  # GLTF furniture models
│       ├── textures/
│       └── icons/
├── public/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 5.2 State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    State Architecture                    │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ projectStore │───▶│  plotStore    │───▶│ question  │  │
│  │             │    │              │    │ Store     │  │
│  │ • projectId │    │ • vertices   │    │           │  │
│  │ • metadata  │    │ • gateDir    │    │ • pending │  │
│  │ • status    │    │ • roadAdj    │    │ • answered│  │
│  └─────────────┘    │ • parking    │    └───────────┘  │
│        │            └──────────────┘          │        │
│        ▼                                      ▼        │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ layoutStore │◀──▶│  floorStore   │───▶│ editorSt. │  │
│  │             │    │              │    │           │  │
│  │ • candidates│    │ • activeFloor│    │ • tool    │  │
│  │ • selected  │    │ • floorMap   │    │ • select  │  │
│  │ • rooms[]   │    │ • transitions│    │ • snap    │  │
│  │ • walls[]   │    └──────────────┘    │ • grid    │  │
│  │ • doors[]   │                        └───────────┘  │
│  └──────┬──────┘                                       │
│         │                                              │
│         ▼                                              │
│  ┌─────────────┐                                       │
│  │  vrStore     │                                       │
│  │             │                                       │
│  │ • activeRoom│                                       │
│  │ • sceneData │                                       │
│  │ • camera    │                                       │
│  │ • furniture │                                       │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

```typescript
// stores/layoutStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Room {
  id: string;
  type: RoomType;
  polygon: [number, number][];
  floor: number;
  area: number;
  label: string;
  constraints: ConstraintResult[];
  style: RoomStyle;
}

interface LayoutState {
  candidates: LayoutCandidate[];
  selectedCandidateIndex: number;
  rooms: Record<string, Room>;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  isDirty: boolean;
  
  // Actions
  selectCandidate: (index: number) => void;
  moveRoom: (roomId: string, delta: { x: number; y: number }) => void;
  resizeRoom: (roomId: string, newPolygon: [number, number][]) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  deleteRoom: (roomId: string) => void;
  updateRoomProperty: (roomId: string, key: string, value: any) => void;
  setLayoutFromServer: (layout: ServerLayout) => void;
}

export const useLayoutStore = create<LayoutState>()(
  immer((set, get) => ({
    candidates: [],
    selectedCandidateIndex: 0,
    rooms: {},
    walls: [],
    doors: [],
    windows: [],
    isDirty: false,

    selectCandidate: (index) => set((state) => {
      state.selectedCandidateIndex = index;
      const candidate = state.candidates[index];
      state.rooms = candidate.rooms;
      state.walls = candidate.walls;
      state.doors = candidate.doors;
      state.isDirty = false;
    }),

    moveRoom: (roomId, delta) => set((state) => {
      const room = state.rooms[roomId];
      if (!room) return;
      room.polygon = room.polygon.map(([x, y]) => [
        x + delta.x,
        y + delta.y,
      ]);
      room.constraints = validateRoomConstraints(room, state);
      state.isDirty = true;
    }),

    // ... additional actions
  }))
);
```

### 5.3 Double-Click VR Transition

```typescript
// hooks/useVRTransition.ts

export function useVRTransition() {
  const router = useRouter();
  const { setActiveRoom, setSceneData } = useVRStore();
  const { rooms } = useLayoutStore();
  const projectId = useProjectStore((s) => s.projectId);

  const handleRoomDoubleClick = useCallback(async (roomId: string) => {
    const room = rooms[roomId];
    if (!room) return;

    setActiveRoom(roomId);

    // Fetch VR scene data from backend
    const sceneData = await api.get(
      `/api/v1/vr/scene/${projectId}/rooms/${roomId}`
    );
    setSceneData(sceneData);

    // Navigate to VR mode with room context
    router.push(`/projects/${projectId}/vr?room=${roomId}`);
  }, [rooms, projectId]);

  return { handleRoomDoubleClick };
}
```

---

## 6. Geometry Engine Design

### 6.1 Core Responsibilities

| Operation | Method | Complexity |
|---|---|---|
| Polygon validation | `validate_polygon()` | O(n log n) |
| Self-intersection detection | `check_self_intersection()` | O(n log n) via sweep line |
| Area computation | `compute_area()` | O(n) Shoelace formula |
| Convex decomposition | `decompose_convex()` | O(n²) Hertel-Mehlhorn |
| Setback computation | `compute_setback()` | O(n) Shapely buffer |
| Polygon offsetting | `offset_polygon()` | O(n) Minkowski sum |
| Point-in-polygon | `point_in_polygon()` | O(n) ray casting |
| Polygon intersection | `intersect()` | O(n+m) Weiler-Atherton |
| Minimum bounding rectangle | `min_bounding_rect()` | O(n log n) rotating calipers |
| Buildable area | `compute_buildable_area()` | O(n) compound operation |

### 6.2 Polygon Validation Pipeline

```python
# engines/geometry/validation.py

from shapely.geometry import Polygon, MultiPolygon
from shapely.validation import make_valid
import numpy as np

class GeometricValidator:
    """Validates and normalizes user-input polygons."""
    
    MIN_AREA_SQM = 20.0       # Minimum viable plot
    MAX_VERTICES = 50          # Complexity limit
    MIN_EDGE_LENGTH = 0.5      # Meters
    MIN_ANGLE_DEG = 15.0       # Avoid degenerate angles
    
    def validate(self, vertices: list[tuple[float, float]]) -> ValidationResult:
        checks = [
            self._check_vertex_count,
            self._check_closure,
            self._check_orientation,
            self._check_self_intersection,
            self._check_minimum_area,
            self._check_edge_lengths,
            self._check_interior_angles,
            self._check_degeneracy,
        ]
        
        errors = []
        warnings = []
        corrected_vertices = list(vertices)
        
        for check in checks:
            result = check(corrected_vertices)
            if result.error:
                errors.append(result.error)
            if result.warning:
                warnings.append(result.warning)
            if result.corrected:
                corrected_vertices = result.corrected
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            corrected_vertices=corrected_vertices,
            polygon=Polygon(corrected_vertices) if not errors else None,
            area=self._compute_area(corrected_vertices),
            perimeter=self._compute_perimeter(corrected_vertices),
            bounding_box=self._compute_bbox(corrected_vertices),
            centroid=self._compute_centroid(corrected_vertices),
        )
    
    def _check_orientation(self, vertices):
        """Ensure counter-clockwise orientation (standard)."""
        area = self._signed_area(vertices)
        if area < 0:
            return CheckResult(
                warning="Polygon was clockwise; reversed to CCW.",
                corrected=list(reversed(vertices))
            )
        return CheckResult()
    
    def _check_self_intersection(self, vertices):
        """Sweep-line self-intersection detection."""
        poly = Polygon(vertices)
        if not poly.is_valid:
            fixed = make_valid(poly)
            if isinstance(fixed, MultiPolygon):
                # Take largest polygon
                largest = max(fixed.geoms, key=lambda g: g.area)
                return CheckResult(
                    warning="Self-intersection detected; auto-repaired.",
                    corrected=list(largest.exterior.coords[:-1])
                )
            return CheckResult(
                corrected=list(fixed.exterior.coords[:-1])
            )
        return CheckResult()
    
    def _check_interior_angles(self, vertices):
        """Reject angles < MIN_ANGLE_DEG (degenerate spikes)."""
        n = len(vertices)
        for i in range(n):
            p0 = np.array(vertices[(i - 1) % n])
            p1 = np.array(vertices[i])
            p2 = np.array(vertices[(i + 1) % n])
            
            v1 = p0 - p1
            v2 = p2 - p1
            
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-10)
            angle_deg = np.degrees(np.arccos(np.clip(cos_angle, -1, 1)))
            
            if angle_deg < self.MIN_ANGLE_DEG:
                return CheckResult(
                    error=f"Interior angle at vertex {i} is {angle_deg:.1f}° "
                          f"(minimum {self.MIN_ANGLE_DEG}°). "
                          f"Adjust plot boundary to remove spike."
                )
        return CheckResult()
    
    @staticmethod
    def _signed_area(vertices):
        """Shoelace formula returning signed area."""
        n = len(vertices)
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += vertices[i][0] * vertices[j][1]
            area -= vertices[j][0] * vertices[i][1]
        return area / 2.0
```

### 6.3 Setback and Buildable Area Computation

```python
# engines/geometry/setback.py

class SetbackCalculator:
    """Computes buildable area after applying regulatory setbacks."""
    
    DEFAULT_SETBACKS = {
        "front": 4.5,   # meters from road
        "rear": 3.0,
        "left": 2.0,
        "right": 2.0,
    }
    
    def compute_buildable_area(
        self,
        plot_polygon: Polygon,
        gate_direction: str,
        road_edges: list[int],  # Edge indices adjacent to road
        setback_config: dict = None,
        floor_number: int = 0,
    ) -> BuildableAreaResult:
        
        setbacks = setback_config or self.DEFAULT_SETBACKS
        
        # Classify edges: road-facing, rear, left, right
        edge_classifications = self._classify_edges(
            plot_polygon, gate_direction, road_edges
        )
        
        # Apply per-edge setback using directional buffering
        setback_polygon = self._apply_directional_setbacks(
            plot_polygon, edge_classifications, setbacks
        )
        
        # Apply floor-specific setback multipliers (upper floors may step back)
        if floor_number > 0:
            floor_multiplier = self._get_floor_multiplier(floor_number)
            setback_polygon = setback_polygon.buffer(
                -floor_multiplier, join_style=2  # MITRE join
            )
        
        return BuildableAreaResult(
            buildable_polygon=setback_polygon,
            buildable_area=setback_polygon.area,
            original_area=plot_polygon.area,
            coverage_ratio=setback_polygon.area / plot_polygon.area,
            setback_lines=self._extract_setback_lines(
                plot_polygon, setback_polygon
            ),
        )
    
    def _apply_directional_setbacks(self, polygon, classifications, setbacks):
        """Apply different setback distances to different edges."""
        coords = list(polygon.exterior.coords[:-1])
        n = len(coords)
        
        # Build per-edge offset polygons and intersect
        result = polygon
        for i, classification in enumerate(classifications):
            edge_start = coords[i]
            edge_end = coords[(i + 1) % n]
            setback_distance = setbacks.get(classification, 2.0)
            
            # Create a half-plane offset from this edge
            offset_line = self._offset_edge_inward(
                edge_start, edge_end, setback_distance, polygon
            )
            half_plane = self._edge_to_half_plane(offset_line)
            result = result.intersection(half_plane)
        
        return result
```

### 6.4 Coordinate System

```
Plot Coordinate System (meters, origin at bottom-left of bounding box):

        North (+Y)
          ▲
          │
          │
West ◄────┼────► East (+X)
          │
          │
          ▼
        South (-Y)

Gate direction determines "front" edge classification.
All internal computations use metric units.
Frontend pixels ↔ meters conversion: configurable scale factor (default 50px/m).
```

---

## 7. Layout Optimization Engine Design

### 7.1 Algorithm Overview

The layout generator uses a **three-phase approach**:

```
Phase 1: Space Partitioning
    Recursive BSP (Binary Space Partitioning) or
    Squarified Treemap decomposition of buildable area

Phase 2: Room Assignment
    Constraint-satisfaction search with backtracking
    Assigns room types to partition cells

Phase 3: Refinement
    Local search optimization (simulated annealing)
    Wall alignment, corridor insertion, door/window placement
```

### 7.2 Space Partitioning

```python
# engines/layout/space_partitioner.py

class SpacePartitioner:
    """Recursively partitions buildable area into room-sized cells."""
    
    def partition(
        self,
        polygon: Polygon,
        room_specs: list[RoomSpec],
        strategy: str = "adaptive_bsp"
    ) -> list[PartitionCell]:
        
        total_area = polygon.area
        room_areas = [spec.target_area for spec in room_specs]
        
        if strategy == "adaptive_bsp":
            return self._adaptive_bsp(polygon, room_specs)
        elif strategy == "treemap":
            return self._squarified_treemap(polygon, room_areas)
        elif strategy == "grid_pack":
            return self._grid_based_packing(polygon, room_specs)
    
    def _adaptive_bsp(
        self, polygon: Polygon, specs: list[RoomSpec], depth: int = 0
    ) -> list[PartitionCell]:
        
        if len(specs) <= 1:
            return [PartitionCell(polygon=polygon, target_spec=specs[0] if specs else None)]
        
        # Find optimal split line
        split_candidates = self._generate_split_candidates(polygon, specs)
        best_split = min(split_candidates, key=lambda s: s.cost)
        
        # Split polygon along best line
        left_poly, right_poly = self._split_polygon(polygon, best_split.line)
        
        # Assign room specs to each side based on area ratio
        left_specs, right_specs = self._assign_specs_to_sides(
            specs, left_poly.area, right_poly.area
        )
        
        # Recurse
        left_cells = self._adaptive_bsp(left_poly, left_specs, depth + 1)
        right_cells = self._adaptive_bsp(right_poly, right_specs, depth + 1)
        
        return left_cells + right_cells
    
    def _generate_split_candidates(self, polygon, specs):
        """Generate candidate split lines (horizontal, vertical, polygon-aligned)."""
        bbox = polygon.bounds
        candidates = []
        
        # Horizontal splits at various ratios
        for ratio in [0.3, 0.4, 0.5, 0.6, 0.7]:
            y = bbox[1] + ratio * (bbox[3] - bbox[1])
            line = LineString([(bbox[0] - 1, y), (bbox[2] + 1, y)])
            cost = self._evaluate_split(polygon, line, specs, ratio)
            candidates.append(SplitCandidate(line=line, cost=cost, ratio=ratio))
        
        # Vertical splits
        for ratio in [0.3, 0.4, 0.5, 0.6, 0.7]:
            x = bbox[0] + ratio * (bbox[2] - bbox[0])
            line = LineString([(x, bbox[1] - 1), (x, bbox[3] + 1)])
            cost = self._evaluate_split(polygon, line, specs, ratio)
            candidates.append(SplitCandidate(line=line, cost=cost, ratio=ratio))
        
        # Edge-aligned splits (for irregular polygons)
        for edge in self._get_polygon_edges(polygon):
            parallel_lines = self._generate_parallel_splits(edge, polygon)
            for pline, ratio in parallel_lines:
                cost = self._evaluate_split(polygon, pline, specs, ratio)
                candidates.append(SplitCandidate(line=pline, cost=cost, ratio=ratio))
        
        return candidates
    
    def _evaluate_split(self, polygon, line, specs, ratio):
        """Cost function for a split: lower = better."""
        try:
            left, right = self._split_polygon(polygon, line)
        except SplitError:
            return float('inf')
        
        # Penalize aspect ratios far from 1.0
        left_aspect = self._aspect_ratio(left)
        right_aspect = self._aspect_ratio(right)
        aspect_cost = abs(left_aspect - 1.5) + abs(right_aspect - 1.5)
        
        # Penalize area mismatch with spec requirements
        target_ratio = sum(s.target_area for s in specs[:len(specs)//2]) / \
                       sum(s.target_area for s in specs)
        area_cost = abs(ratio - target_ratio) * 10
        
        # Penalize narrow corridors
        min_dim_cost = 0
        for poly in [left, right]:
            min_dim = self._minimum_width(poly)
            if min_dim < 2.0:  # Less than 2m width
                min_dim_cost += (2.0 - min_dim) * 50
        
        return aspect_cost + area_cost + min_dim_cost
```

### 7.3 Tree-Search Candidate Generation

```python
# engines/layout/search.py

class LayoutSearchEngine:
    """Generates multiple layout candidates via tree search."""
    
    MAX_CANDIDATES = 20
    BEAM_WIDTH = 8
    MAX_DEPTH = 50
    
    def generate_candidates(
        self,
        buildable_area: Polygon,
        room_specs: list[RoomSpec],
        constraints: CompiledConstraints,
        seed: int = 42,
    ) -> list[LayoutCandidate]:
        
        rng = np.random.RandomState(seed)
        candidates = []
        
        # Strategy 1: Multiple BSP partitioning variants
        for partition_seed in rng.randint(0, 10000, size=6):
            partitioner = SpacePartitioner(seed=partition_seed)
            cells = partitioner.partition(buildable_area, room_specs, "adaptive_bsp")
            assignment = self._assign_rooms_to_cells(cells, room_specs, constraints, rng)
            if assignment:
                refined = self._refine_layout(assignment, constraints)
                candidates.append(refined)
        
        # Strategy 2: Treemap-based
        for treemap_seed in rng.randint(0, 10000, size=4):
            cells = SpacePartitioner(seed=treemap_seed).partition(
                buildable_area, room_specs, "treemap"
            )
            assignment = self._assign_rooms_to_cells(cells, room_specs, constraints, rng)
            if assignment:
                refined = self._refine_layout(assignment, constraints)
                candidates.append(refined)
        
        # Strategy 3: Grid-based packing
        for grid_seed in rng.randint(0, 10000, size=4):
            cells = SpacePartitioner(seed=grid_seed).partition(
                buildable_area, room_specs, "grid_pack"
            )
            assignment = self._assign_rooms_to_cells(cells, room_specs, constraints, rng)
            if assignment:
                refined = self._refine_layout(assignment, constraints)
                candidates.append(refined)
        
        # Strategy 4: Stochastic placement
        for stoch_seed in rng.randint(0, 10000, size=6):
            layout = self._stochastic_placement(
                buildable_area, room_specs, constraints, stoch_seed
            )
            if layout:
                candidates.append(layout)
        
        # Deduplicate similar layouts
        candidates = self._deduplicate(candidates, similarity_threshold=0.85)
        
        # Return top candidates by preliminary score
        candidates.sort(key=lambda c: c.preliminary_score, reverse=True)
        return candidates[:self.MAX_CANDIDATES]
    
    def _assign_rooms_to_cells(self, cells, specs, constraints, rng):
        """CSP-based room-to-cell assignment with backtracking."""
        n = len(cells)
        m = len(specs)
        
        # Build adjacency graph of cells
        adj = self._build_cell_adjacency(cells)
        
        # Sort specs by most constrained first (MRV heuristic)
        ordered_specs = sorted(specs, key=lambda s: len(s.constraints), reverse=True)
        
        assignment = {}
        return self._backtrack_assign(
            ordered_specs, 0, cells, adj, constraints, assignment, rng
        )
    
    def _refine_layout(self, assignment, constraints):
        """Simulated annealing refinement."""
        current = assignment
        current_score = self._quick_score(current)
        temperature = 100.0
        cooling_rate = 0.995
        
        for iteration in range(2000):
            # Generate neighbor: swap two rooms, adjust wall, resize room
            neighbor = self._generate_neighbor(current)
            
            if not self._satisfies_hard_constraints(neighbor, constraints):
                continue
            
            neighbor_score = self._quick_score(neighbor)
            delta = neighbor_score - current_score
            
            if delta > 0 or np.random.random() < np.exp(delta / temperature):
                current = neighbor
                current_score = neighbor_score
            
            temperature *= cooling_rate
        
        return LayoutCandidate(
            rooms=current.rooms,
            walls=self._generate_walls(current),
            doors=self._place_doors(current, constraints),
            windows=self._place_windows(current, constraints),
            corridors=self._generate_corridors(current),
            preliminary_score=current_score,
        )
```

---

## 8. Constraint Engine Design

### 8.1 Constraint Taxonomy

```
Constraint Types
├── HARD CONSTRAINTS (must satisfy — layout rejected if violated)
│   ├── Structural
│   │   ├── Minimum room dimension (no room < 2.1m in any direction)
│   │   ├── Load-bearing wall alignment across floors
│   │   ├── Stairwell/elevator shaft continuity
│   │   └── Maximum span without support (6m residential, 9m commercial)
│   ├── Regulatory
│   │   ├── Setback compliance
│   │   ├── Floor Area Ratio (FAR) limits
│   │   ├── Ground coverage ratio
│   │   ├── Minimum room sizes (per building code)
│   │   ├── Minimum ventilation area (1/10th of room area)
│   │   ├── Fire exit requirements
│   │   └── Accessibility (wheelchair turning radius 1.5m)
│   └── Physical
│       ├── No room overlap
│       ├── All rooms within buildable boundary
│       ├── Contiguous layout (no isolated rooms without corridor access)
│       └── Plumbing stack alignment (wet rooms vertically aligned)
│
├── SOFT CONSTRAINTS (scored — deduction for violation)
│   ├── Adjacency preferences
│   │   ├── Kitchen adjacent to dining
│   │   ├── Master bedroom away from kitchen
│   │   ├── Bathroom accessible from bedroom
│   │   └── Living room near entrance
│   ├── Orientation preferences
│   │   ├── Bedroom facing East/Southeast (morning sun)
│   │   ├── Kitchen facing North (less heat in tropical climates)
│   │   ├── Living room facing South/Southwest
│   │   └── Avoid west-facing large windows
│   ├── Privacy
│   │   ├── Bedroom not directly visible from entrance
│   │   ├── Bathroom not opening to living/dining
│   │   └── Service areas separated from living areas
│   └── Circulation
│       ├── Corridor width ≥ 1.2m (preferred ≥ 1.5m)
│       ├── Minimize corridor length (dead space)
│       ├── Maximum room depth from corridor ≤ 2 rooms
│       └── Clear sightline from entrance
│
└── USER CONSTRAINTS (from question engine)
    ├── Room count and types
    ├── Specific adjacency requests
    ├── Vastu/Feng Shui preferences
    ├── Natural lighting priorities
    ├── Parking requirements
    └── Budget-driven area targets
```

### 8.2 Rule Engine Implementation

```python
# engines/constraints/rule_engine.py

from dataclasses import dataclass
from enum import Enum
from typing import Callable

class ConstraintSeverity(Enum):
    HARD = "hard"       # Must satisfy
    SOFT = "soft"       # Scored penalty
    PREFERENCE = "pref" # Minor scoring influence

@dataclass
class Constraint:
    id: str
    name: str
    severity: ConstraintSeverity
    category: str
    evaluator: Callable       # (layout, context) -> ConstraintResult
    penalty_weight: float     # For soft constraints
    description: str
    applicable_rooms: list[str] = None  # None = all rooms

@dataclass
class ConstraintResult:
    satisfied: bool
    violation_score: float    # 0.0 = fully satisfied, 1.0 = max violation
    details: str
    affected_rooms: list[str]
    fix_suggestion: str = None

class ConstraintEngine:
    def __init__(self):
        self.constraints: list[Constraint] = []
        self._register_default_constraints()
    
    def _register_default_constraints(self):
        # --- HARD CONSTRAINTS ---
        self.register(Constraint(
            id="HC001",
            name="no_room_overlap",
            severity=ConstraintSeverity.HARD,
            category="physical",
            evaluator=self._check_no_overlap,
            penalty_weight=0,
            description="No two rooms may overlap in area."
        ))
        
        self.register(Constraint(
            id="HC002",
            name="within_boundary",
            severity=ConstraintSeverity.HARD,
            category="physical",
            evaluator=self._check_within_boundary,
            penalty_weight=0,
            description="All rooms must be within the buildable area."
        ))
        
        self.register(Constraint(
            id="HC003",
            name="minimum_dimension",
            severity=ConstraintSeverity.HARD,
            category="structural",
            evaluator=self._check_min_dimension,
            penalty_weight=0,
            description="No room dimension may be less than 2.1 meters."
        ))
        
        self.register(Constraint(
            id="HC004",
            name="min_room_area",
            severity=ConstraintSeverity.HARD,
            category="regulatory",
            evaluator=self._check_min_room_areas,
            penalty_weight=0,
            description="Each room type must meet minimum area per code."
        ))
        
        # --- SOFT CONSTRAINTS ---
        self.register(Constraint(
            id="SC001",
            name="kitchen_dining_adjacency",
            severity=ConstraintSeverity.SOFT,
            category="adjacency",
            evaluator=self._check_kitchen_dining_adj,
            penalty_weight=15.0,
            description="Kitchen should be adjacent to dining area.",
            applicable_rooms=["kitchen", "dining"]
        ))
        
        self.register(Constraint(
            id="SC002",
            name="bedroom_orientation",
            severity=ConstraintSeverity.SOFT,
            category="orientation",
            evaluator=self._check_bedroom_orientation,
            penalty_weight=10.0,
            description="Bedrooms should preferably face East/Southeast.",
            applicable_rooms=["bedroom", "master_bedroom"]
        ))
        
        self.register(Constraint(
            id="SC003",
            name="corridor_efficiency",
            severity=ConstraintSeverity.SOFT,
            category="circulation",
            evaluator=self._check_corridor_efficiency,
            penalty_weight=20.0,
            description="Corridor area should be < 15% of total floor area."
        ))
    
    def evaluate_layout(
        self, layout: Layout, context: ConstraintContext
    ) -> ConstraintReport:
        
        results = []
        hard_violations = 0
        total_penalty = 0.0
        
        for constraint in self.constraints:
            # Check applicability
            if constraint.applicable_rooms:
                relevant_rooms = [
                    r for r in layout.rooms
                    if r.type in constraint.applicable_rooms
                ]
                if not relevant_rooms:
                    continue
            
            result = constraint.evaluator(layout, context)
            results.append((constraint, result))
            
            if constraint.severity == ConstraintSeverity.HARD and not result.satisfied:
                hard_violations += 1
            
            if not result.satisfied:
                total_penalty += constraint.penalty_weight * result.violation_score
        
        return ConstraintReport(
            all_satisfied=hard_violations == 0,
            hard_violations=hard_violations,
            total_penalty=total_penalty,
            results=results,
        )
    
    # --- Evaluator implementations ---
    
    def _check_no_overlap(self, layout, ctx) -> ConstraintResult:
        rooms = layout.rooms
        overlaps = []
        for i in range(len(rooms)):
            for j in range(i + 1, len(rooms)):
                if rooms[i].polygon_shape.intersects(rooms[j].polygon_shape):
                    intersection = rooms[i].polygon_shape.intersection(
                        rooms[j].polygon_shape
                    )
                    if intersection.area > 0.01:  # Tolerance: 0.01 sqm
                        overlaps.append((rooms[i].id, rooms[j].id, intersection.area))
        
        if overlaps:
            return ConstraintResult(
                satisfied=False,
                violation_score=1.0,
                details=f"{len(overlaps)} room overlaps detected.",
                affected_rooms=[r for o in overlaps for r in o[:2]],
                fix_suggestion="Resize or move overlapping rooms."
            )
        return ConstraintResult(satisfied=True, violation_score=0.0,
                               details="No overlaps.", affected_rooms=[])
    
    MINIMUM_AREAS = {
        "bedroom": 9.5,          # sqm
        "master_bedroom": 12.0,
        "kitchen": 5.0,
        "bathroom": 2.8,
        "living_room": 12.0,
        "dining": 7.5,
        "study": 6.0,
        "store": 2.0,
        "garage": 18.0,
        "balcony": 3.0,
    }
    
    def _check_min_room_areas(self, layout, ctx) -> ConstraintResult:
        violations = []
        for room in layout.rooms:
            min_area = self.MINIMUM_AREAS.get(room.type, 4.0)
            if room.area < min_area:
                violations.append(
                    f"{room.label}: {room.area:.1f}sqm < {min_area}sqm minimum"
                )
        
        if violations:
            return ConstraintResult(
                satisfied=False,
                violation_score=1.0,
                details="; ".join(violations),
                affected_rooms=[v.split(":")[0] for v in violations],
            )
        return ConstraintResult(satisfied=True, violation_score=0.0,
                               details="All rooms meet area minimums.",
                               affected_rooms=[])
```

---

## 9. Scoring System Design

### 9.1 Multi-Objective Scoring Formula

The scoring system evaluates each layout candidate across 8 dimensions, producing a composite score ∈ [0, 100]:

```
S_total = Σ(w_i × S_i) - P_constraints

Where:
  S_i ∈ [0, 1] = normalized score for dimension i
  w_i = weight for dimension i (Σw_i = 100)
  P_constraints = soft constraint penalty (see §8)
```

### 9.2 Scoring Dimensions

| Dimension | Symbol | Weight (default) | Description |
|---|---|---|---|
| Space Utilization | S_util | 20 | Ratio of usable room area to buildable area |
| Adjacency Satisfaction | S_adj | 18 | Percentage of adjacency preferences met |
| Aspect Ratio Quality | S_aspect | 12 | Average room aspect ratio closeness to ideal |
| Natural Light Access | S_light | 12 | Percentage of habitable rooms with exterior wall |
| Circulation Efficiency | S_circ | 12 | Corridor area ratio (lower = better) |
| Privacy Score | S_priv | 10 | Privacy gradient from public to private zones |
| Orientation Match | S_orient | 8 | Room orientations matching preferences |
| Structural Regularity | S_struct | 8 | Wall alignment, grid regularity |

### 9.3 Detailed Metric Calculations

```python
# engines/scoring/metrics.py

class LayoutMetrics:
    
    def space_utilization(self, layout: Layout, buildable: Polygon) -> float:
        """S_util: Higher is better. Target: 0.80-0.90"""
        total_room_area = sum(r.area for r in layout.rooms)
        corridor_area = sum(c.area for c in layout.corridors)
        wall_area = self._estimate_wall_area(layout)
        
        usable = total_room_area
        total = buildable.area
        
        ratio = usable / total
        
        # Penalize both under-utilization and over-packing
        if ratio < 0.60:
            return ratio / 0.60  # Linear ramp up to 60%
        elif ratio <= 0.90:
            return 1.0  # Sweet spot
        else:
            return max(0, 1.0 - (ratio - 0.90) * 5)  # Penalty above 90%
    
    def adjacency_satisfaction(
        self, layout: Layout, adj_requirements: list[AdjRequirement]
    ) -> float:
        """S_adj: Fraction of adjacency requirements satisfied."""
        if not adj_requirements:
            return 1.0
        
        satisfied = 0
        total_weight = 0
        
        for req in adj_requirements:
            total_weight += req.importance
            room_a = layout.find_room_by_type(req.room_type_a)
            room_b = layout.find_room_by_type(req.room_type_b)
            
            if room_a and room_b:
                shared_edge = room_a.polygon_shape.intersection(
                    room_b.polygon_shape
                )
                # Consider adjacent if they share an edge ≥ 0.5m
                if hasattr(shared_edge, 'length') and shared_edge.length >= 0.5:
                    satisfied += req.importance
                elif req.allow_nearby:
                    distance = room_a.polygon_shape.distance(room_b.polygon_shape)
                    if distance < 3.0:  # Within one corridor width
                        satisfied += req.importance * 0.5
        
        return satisfied / total_weight if total_weight > 0 else 1.0
    
    def aspect_ratio_quality(self, layout: Layout) -> float:
        """S_aspect: Rooms closer to ideal aspect ratios score higher."""
        IDEAL_ASPECTS = {
            "bedroom": (1.2, 1.6),
            "master_bedroom": (1.2, 1.5),
            "living_room": (1.3, 1.8),
            "kitchen": (1.0, 1.5),
            "bathroom": (1.0, 2.0),
            "dining": (1.0, 1.5),
            "study": (1.0, 1.4),
            "corridor": (3.0, 15.0),
        }
        
        scores = []
        for room in layout.rooms:
            ar = self._compute_aspect_ratio(room)
            ideal_range = IDEAL_ASPECTS.get(room.type, (1.0, 2.0))
            
            if ideal_range[0] <= ar <= ideal_range[1]:
                scores.append(1.0)
            else:
                distance = min(
                    abs(ar - ideal_range[0]),
                    abs(ar - ideal_range[1])
                )
                scores.append(max(0, 1.0 - distance * 0.3))
        
        return np.mean(scores) if scores else 0.5
    
    def natural_light_access(self, layout: Layout, buildable: Polygon) -> float:
        """S_light: Fraction of habitable rooms touching exterior wall."""
        habitable_types = {
            "bedroom", "master_bedroom", "living_room",
            "dining", "study", "kitchen"
        }
        
        exterior_boundary = buildable.boundary
        habitable_rooms = [r for r in layout.rooms if r.type in habitable_types]
        
        if not habitable_rooms:
            return 1.0
        
        lit_count = 0
        for room in habitable_rooms:
            room_boundary = room.polygon_shape.boundary
            shared = room_boundary.intersection(exterior_boundary)
            
            # At least 1.5m of exterior wall exposure (enough for a window)
            if hasattr(shared, 'length') and shared.length >= 1.5:
                lit_count += 1
        
        return lit_count / len(habitable_rooms)
    
    def circulation_efficiency(self, layout: Layout) -> float:
        """S_circ: Lower corridor ratio = higher score."""
        total_area = sum(r.area for r in layout.rooms) + \
                     sum(c.area for c in layout.corridors)
        corridor_area = sum(c.area for c in layout.corridors)
        
        if total_area == 0:
            return 0
        
        ratio = corridor_area / total_area
        
        # 0% corridor = 1.0 (open plan), 15%+ = 0.0
        return max(0, 1.0 - ratio / 0.15)
    
    def privacy_score(self, layout: Layout, gate_direction: str) -> float:
        """S_priv: Public rooms near entrance, private rooms far."""
        PUBLIC_ROOMS = {"living_room", "dining", "kitchen", "guest_room"}
        PRIVATE_ROOMS = {"bedroom", "master_bedroom", "bathroom", "study"}
        
        entrance_point = self._estimate_entrance_point(layout, gate_direction)
        
        public_distances = []
        private_distances = []
        
        for room in layout.rooms:
            centroid = room.polygon_shape.centroid
            distance = entrance_point.distance(centroid)
            
            if room.type in PUBLIC_ROOMS:
                public_distances.append(distance)
            elif room.type in PRIVATE_ROOMS:
                private_distances.append(distance)
        
        if not public_distances or not private_distances:
            return 0.5
        
        avg_public = np.mean(public_distances)
        avg_private = np.mean(private_distances)
        
        # Private rooms should be further from entrance than public rooms
        if avg_private > avg_public:
            return min(1.0, (avg_private - avg_public) / avg_public)
        else:
            return max(0, 0.5 - (avg_public - avg_private) / avg_public)
```

### 9.4 Composite Scorer

```python
# engines/scoring/scorer.py

class LayoutScorer:
    DEFAULT_WEIGHTS = {
        "space_utilization": 20,
        "adjacency_satisfaction": 18,
        "aspect_ratio_quality": 12,
        "natural_light_access": 12,
        "circulation_efficiency": 12,
        "privacy_score": 10,
        "orientation_match": 8,
        "structural_regularity": 8,
    }
    
    def score(
        self,
        layout: Layout,
        context: ScoringContext,
        weights: dict = None,
    ) -> ScoringResult:
        
        w = weights or self.DEFAULT_WEIGHTS
        metrics = LayoutMetrics()
        
        dimension_scores = {
            "space_utilization": metrics.space_utilization(
                layout, context.buildable_area
            ),
            "adjacency_satisfaction": metrics.adjacency_satisfaction(
                layout, context.adjacency_requirements
            ),
            "aspect_ratio_quality": metrics.aspect_ratio_quality(layout),
            "natural_light_access": metrics.natural_light_access(
                layout, context.buildable_area
            ),
            "circulation_efficiency": metrics.circulation_efficiency(layout),
            "privacy_score": metrics.privacy_score(
                layout, context.gate_direction
            ),
            "orientation_match": metrics.orientation_match(
                layout, context.orientation_prefs
            ),
            "structural_regularity": metrics.structural_regularity(layout),
        }
        
        # Weighted composite
        composite = sum(
            w[dim] * score for dim, score in dimension_scores.items()
        )
        
        # Apply constraint penalties
        constraint_report = context.constraint_engine.evaluate_layout(
            layout, context.constraint_context
        )
        composite -= constraint_report.total_penalty
        
        # Clamp to [0, 100]
        composite = max(0, min(100, composite))
        
        return ScoringResult(
            total_score=round(composite, 2),
            dimension_scores={
                k: round(v * 100, 1) for k, v in dimension_scores.items()
            },
            weights=w,
            constraint_penalty=constraint_report.total_penalty,
            constraint_report=constraint_report,
            rank=None,  # Set during candidate comparison
        )
```

### 9.5 Pareto Ranking

```python
# engines/scoring/pareto.py

def pareto_rank(candidates: list[ScoredCandidate]) -> list[ScoredCandidate]:
    """Assign Pareto front ranks for multi-objective comparison."""
    n = len(candidates)
    ranks = [0] * n
    
    objectives = [
        "space_utilization", "adjacency_satisfaction",
        "natural_light_access", "privacy_score"
    ]
    
    # Extract objective vectors
    obj_matrix = np.array([
        [c.dimension_scores[o] for o in objectives]
        for c in candidates
    ])
    
    # Iteratively find Pareto fronts
    remaining = set(range(n))
    current_rank = 1
    
    while remaining:
        front = []
        for i in remaining:
            dominated = False
            for j in remaining:
                if i == j:
                    continue
                if all(obj_matrix[j] >= obj_matrix[i]) and \
                   any(obj_matrix[j] > obj_matrix[i]):
                    dominated = True
                    break
            if not dominated:
                front.append(i)
        
        for idx in front:
            ranks[idx] = current_rank
            remaining.discard(idx)
        current_rank += 1
    
    for i, candidate in enumerate(candidates):
        candidate.pareto_rank = ranks[i]
    
    return sorted(candidates, key=lambda c: (c.pareto_rank, -c.total_score))
```

---

## 10. Dynamic Question Engine Design

### 10.1 Architecture

The question engine uses an LLM to generate contextually relevant follow-up questions based on the constraint graph state, detecting ambiguities and missing information.

```
┌──────────────────┐
│ User Input State │
│ (partial spec)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────────────┐
│ Constraint Graph │────▶│ Gap Analyzer                 │
│ Analysis         │     │ • Missing required info      │
│                  │     │ • Ambiguous specifications   │
└──────────────────┘     │ • Conflicting constraints    │
                         │ • Optimization opportunities │
                         └─────────────┬────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────────┐
                         │ LLM Question Generator       │
                         │ (GPT-4o / Claude)             │
                         │                              │
                         │ System prompt: architect role │
                         │ Context: gap analysis + plot  │
                         │ Output: structured questions  │
                         └─────────────┬────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────────┐
                         │ Question Validator & Ranker   │
                         │ • Dedup against asked Qs     │
                         │ • Priority ranking           │
                         │ • Batch size limiting        │
                         └─────────────┬────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────────┐
                         │ Structured Questions         │
                         │ (JSON with options/types)    │
                         └──────────────────────────────┘
```

### 10.2 Implementation

```python
# engines/questions/question_engine.py

class DynamicQuestionEngine:
    
    QUESTION_CATEGORIES = [
        "room_specification",
        "lifestyle_preference",
        "orientation_preference",
        "circulation_preference",
        "parking_specification",
        "structural_preference",
        "budget_constraint",
        "aesthetic_preference",
        "accessibility_requirement",
        "cultural_preference",     # Vastu, Feng Shui
    ]
    
    async def generate_questions(
        self,
        user_input: UserInputState,
        asked_questions: list[str],
        constraint_state: ConstraintGraphState,
    ) -> list[StructuredQuestion]:
        
        # Step 1: Analyze gaps
        gaps = self._analyze_gaps(user_input, constraint_state)
        
        # Step 2: Build LLM context
        context = self._build_context(user_input, gaps, asked_questions)
        
        # Step 3: Generate via LLM
        raw_questions = await self._llm_generate(context)
        
        # Step 4: Validate and structure
        structured = self._validate_and_structure(raw_questions, asked_questions)
        
        # Step 5: Prioritize
        prioritized = self._prioritize(structured, gaps)
        
        return prioritized[:5]  # Max 5 questions per round
    
    def _analyze_gaps(self, user_input, constraint_state):
        gaps = []
        
        # Check room specification completeness
        if not user_input.room_requirements:
            gaps.append(Gap(
                category="room_specification",
                severity="critical",
                detail="No room requirements specified."
            ))
        else:
            total_room_area = sum(r.get("area", 0) for r in user_input.room_requirements)
            buildable_ratio = total_room_area / (constraint_state.buildable_area * 0.85)
            if buildable_ratio > 1.1:
                gaps.append(Gap(
                    category="room_specification",
                    severity="high",
                    detail=f"Requested room areas ({total_room_area:.0f}sqm) exceed "
                           f"buildable area. Need prioritization."
                ))
        
        # Check for wet room grouping info
        wet_rooms = [r for r in user_input.room_requirements
                     if r["type"] in ("kitchen", "bathroom", "laundry")]
        if len(wet_rooms) > 1 and "plumbing_grouping" not in user_input.answered_topics:
            gaps.append(Gap(
                category="structural_preference",
                severity="medium",
                detail="Multiple wet rooms — plumbing stack grouping unknown."
            ))
        
        # Check parking details
        if user_input.parking_config.get("type") == "inside" and \
           "ramp_direction" not in user_input.parking_config:
            gaps.append(Gap(
                category="parking_specification",
                severity="high",
                detail="Indoor parking specified but ramp direction unknown."
            ))
        
        # Check cultural preferences
        if "cultural_preference" not in user_input.answered_topics:
            gaps.append(Gap(
                category="cultural_preference",
                severity="low",
                detail="No Vastu/Feng Shui preference specified."
            ))
        
        return gaps
    
    async def _llm_generate(self, context: str) -> list[dict]:
        response = await self.llm_client.chat(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": QUESTION_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": context
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.content)["questions"]


QUESTION_SYSTEM_PROMPT = """You are an expert architectural consultant conducting 
a design intake interview. Based on the provided plot information, current 
specifications, and identified information gaps, generate targeted follow-up 
questions.

Rules:
1. Each question must resolve a specific design ambiguity or constraint gap.
2. Prefer multiple-choice questions with sensible defaults.
3. Never ask questions already answered.
4. Questions should be in natural, non-technical language.
5. Group related questions logically.
6. Include a "why this matters" brief explanation for each question.

Output JSON format:
{
  "questions": [
    {
      "id": "q_<category>_<n>",
      "text": "question text",
      "type": "single_choice|multi_choice|numeric|text|boolean",
      "options": ["opt1", "opt2", ...],
      "default": "opt1",
      "category": "category_name",
      "why_it_matters": "brief explanation",
      "constraint_impact": ["constraint_id_1", "constraint_id_2"],
      "priority": 1-5
    }
  ]
}"""
```

### 10.3 Answer Processing

```python
# engines/questions/answer_processor.py

class AnswerProcessor:
    """Maps user answers to concrete layout constraints."""
    
    ANSWER_CONSTRAINT_MAP = {
        "cultural_preference": {
            "vastu": [
                Constraint("master_bedroom_sw", "Master bedroom in Southwest"),
                Constraint("kitchen_se", "Kitchen in Southeast"),
                Constraint("entrance_ne", "Main entrance facing Northeast"),
                Constraint("bathroom_nw", "Bathroom in Northwest"),
                Constraint("pooja_ne", "Prayer room in Northeast"),
            ],
            "feng_shui": [
                Constraint("kitchen_s", "Kitchen in South sector"),
                Constraint("bedroom_sw", "Bedroom in Southwest sector"),
                Constraint("entrance_yang", "Entrance in active Yang direction"),
            ],
            "none": [],
        },
        "plumbing_grouping": {
            "grouped": [
                Constraint("wet_rooms_adjacent", "All wet rooms share wall", weight=25),
            ],
            "flexible": [
                Constraint("wet_rooms_proximity", "Wet rooms within 5m", weight=10),
            ],
        },
    }
    
    def process_answers(
        self, answers: dict[str, any], current_constraints: list[Constraint]
    ) -> list[Constraint]:
        new_constraints = []
        
        for question_id, answer in answers.items():
            category = question_id.split("_")[1]  # e.g., q_cultural_1 -> cultural
            
            if category in self.ANSWER_CONSTRAINT_MAP:
                mapped = self.ANSWER_CONSTRAINT_MAP[category].get(answer, [])
                new_constraints.extend(mapped)
            else:
                # Fallback: use LLM to interpret free-text answers
                inferred = await self._llm_interpret_answer(question_id, answer)
                new_constraints.extend(inferred)
        
        return current_constraints + new_constraints
```

### 10.4 Sample Question Flow JSON

```json
{
  "session_id": "qs_a1b2c3d4",
  "round": 2,
  "questions": [
    {
      "id": "q_lifestyle_1",
      "text": "How many people will live in this home?",
      "type": "numeric",
      "range": [1, 20],
      "default": 4,
      "category": "lifestyle_preference",
      "why_it_matters": "Determines bathroom count, kitchen size, and common area proportions.",
      "priority": 1
    },
    {
      "id": "q_cultural_1",
      "text": "Do you have any Vastu or Feng Shui preferences for room placement?",
      "type": "single_choice",
      "options": ["Follow Vastu Shastra", "Follow Feng Shui", "No preference"],
      "default": "No preference",
      "category": "cultural_preference",
      "why_it_matters": "Influences room directional placement — e.g., Vastu places kitchen in Southeast.",
      "priority": 2
    },
    {
      "id": "q_parking_1",
      "text": "Where should the car ramp enter relative to the building?",
      "type": "single_choice",
      "options": ["Front-left", "Front-right", "Side entry", "Rear entry"],
      "default": "Front-right",
      "category": "parking_specification",
      "why_it_matters": "Ramp position affects ground floor layout and structural column placement.",
      "priority": 3
    },
    {
      "id": "q_privacy_1",
      "text": "Should guest areas be separated from family living areas?",
      "type": "boolean",
      "default": true,
      "category": "lifestyle_preference",
      "why_it_matters": "Creates a privacy zone division, affecting corridor design and room grouping.",
      "priority": 3
    },
    {
      "id": "q_light_1",
      "text": "Which rooms should get the most natural light? (Select up to 3)",
      "type": "multi_choice",
      "options": ["Living Room", "Master Bedroom", "Kitchen", "Study", "Dining Room"],
      "max_selections": 3,
      "category": "orientation_preference",
      "why_it_matters": "High-priority rooms will be placed on exterior walls with larger window openings.",
      "priority": 4
    }
  ]
}
```

---

## 11. Multi-Floor Architecture Design

### 11.1 Vertical Coherence Model

```
Floor N   ┌──────────────────────────────────┐
          │  Rooms + Terrace + Stair landing  │
          │  ▼ columns from Floor N-1         │
          └──────────┬───────────────────────┘
                     │ structural alignment
Floor N-1 ┌──────────┴───────────────────────┐
          │  Rooms + Stair + Elevator shaft   │
          │  ▼ columns from Floor N-2         │
          └──────────┬───────────────────────┘
                     │
Floor 1   ┌──────────┴───────────────────────┐
          │  Rooms + Stair start              │
          │  Lobby / Entrance                 │
          └──────────┬───────────────────────┘
                     │
Ground    ┌──────────┴───────────────────────┐
          │  Parking / Lobby / Commercial     │
          │  Ramp + Stairwell + Elevator      │
          └──────────────────────────────────┘
```

### 11.2 Structural Alignment Constraints

```python
# engines/constraints/structural.py

class StructuralAlignmentChecker:
    """Enforces vertical structural coherence across floors."""
    
    COLUMN_GRID_TOLERANCE = 0.3  # meters
    MIN_COLUMN_SPACING = 3.0
    MAX_COLUMN_SPACING = 6.0
    
    def check_vertical_alignment(
        self, floor_layouts: dict[int, Layout]
    ) -> StructuralReport:
        
        issues = []
        
        # 1. Column grid extraction from ground floor
        ground = floor_layouts[0]
        column_grid = self._extract_column_grid(ground)
        
        # 2. For each upper floor, verify load paths
        for floor_num in sorted(floor_layouts.keys()):
            if floor_num == 0:
                continue
            
            layout = floor_layouts[floor_num]
            
            # Check that major walls align with columns
            wall_alignment = self._check_wall_column_alignment(
                layout.walls, column_grid
            )
            if wall_alignment.misaligned_walls:
                issues.append(StructuralIssue(
                    floor=floor_num,
                    type="wall_misalignment",
                    details=wall_alignment.misaligned_walls,
                    severity="warning"
                ))
            
            # Check stairwell continuity
            stair = layout.find_room_by_type("stairwell")
            prev_stair = floor_layouts[floor_num - 1].find_room_by_type("stairwell")
            if stair and prev_stair:
                overlap = stair.polygon_shape.intersection(prev_stair.polygon_shape)
                if overlap.area / stair.area < 0.95:
                    issues.append(StructuralIssue(
                        floor=floor_num,
                        type="stairwell_misalignment",
                        severity="critical"
                    ))
            
            # Check wet room stacking
            wet_rooms = [r for r in layout.rooms if r.type in ("bathroom", "kitchen")]
            prev_wet = [r for r in floor_layouts[floor_num-1].rooms
                       if r.type in ("bathroom", "kitchen")]
            self._check_wet_stacking(wet_rooms, prev_wet, floor_num, issues)
        
        return StructuralReport(issues=issues, column_grid=column_grid)
    
    def _extract_column_grid(self, ground_layout: Layout) -> ColumnGrid:
        """Derive a structural column grid from room corners."""
        # Collect all wall intersection points
        intersections = set()
        for wall in ground_layout.walls:
            intersections.add(wall.start)
            intersections.add(wall.end)
        
        # Cluster nearby points into column positions
        points = np.array(list(intersections))
        clusters = self._cluster_points(points, tolerance=self.COLUMN_GRID_TOLERANCE)
        
        # Find dominant grid lines (X and Y)
        x_lines = self._find_grid_lines([c[0] for c in clusters], axis='x')
        y_lines = self._find_grid_lines([c[1] for c in clusters], axis='y')
        
        return ColumnGrid(
            columns=clusters,
            x_grid_lines=x_lines,
            y_grid_lines=y_lines,
            regularity_score=self._grid_regularity(x_lines, y_lines),
        )
```

### 11.3 Floor Navigation Data Model

```json
{
  "project_id": "proj_abc123",
  "total_floors": 4,
  "floors": {
    "0": {
      "label": "Ground Floor",
      "type": "parking",
      "elevation_m": 0.0,
      "floor_height_m": 3.6,
      "buildable_polygon": [[0,0],[20,0],[20,15],[0,15]],
      "rooms": ["room_g1", "room_g2", "stair_g"],
      "has_ramp": true
    },
    "1": {
      "label": "First Floor",
      "type": "residential",
      "elevation_m": 3.6,
      "floor_height_m": 3.0,
      "buildable_polygon": [[0,0],[20,0],[20,15],[0,15]],
      "rooms": ["room_1a", "room_1b", "room_1c", "stair_1"],
      "has_balcony": true
    },
    "2": {
      "label": "Second Floor",
      "type": "residential",
      "elevation_m": 6.6,
      "floor_height_m": 3.0,
      "buildable_polygon": [[1,0],[19,0],[19,14],[1,14]],
      "rooms": ["room_2a", "room_2b", "room_2c", "stair_2"],
      "stepped_back": true
    },
    "3": {
      "label": "Terrace",
      "type": "terrace",
      "elevation_m": 9.6,
      "floor_height_m": 0,
      "buildable_polygon": [[1,0],[19,0],[19,14],[1,14]],
      "rooms": ["terrace_util", "stair_3"],
      "is_open": true
    }
  }
}
```

---

## 12. Interactive Editor Design

### 12.1 Editor Capabilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Layout Editor Canvas                              │
│                                                                     │
│  ┌─────────┐  ┌───────────────────────────────────────────────────┐ │
│  │ Tool    │  │                                                   │ │
│  │ Palette │  │              Konva.js Stage                       │ │
│  │         │  │                                                   │ │
│  │ [Select]│  │   ┌──────────┐ ┌──────────┐ ┌──────────────┐    │ │
│  │ [Move]  │  │   │ Living   │ │ Dining   │ │  Kitchen     │    │ │
│  │ [Resize]│  │   │ Room     │ │          │ │              │    │ │
│  │ [Wall]  │  │   │ 18.5 sqm │ │ 12.0 sqm│ │  8.2 sqm     │    │ │
│  │ [Door]  │  │   └──────────┘ └──────────┘ └──────────────┘    │ │
│  │ [Window]│  │   ┌──────────────┐ ┌─────────┐ ┌───────────┐    │ │
│  │ [Room+] │  │   │ Master       │ │ Bath    │ │ Bedroom 2 │    │ │
│  │ [Delete]│  │   │ Bedroom      │ │ 4.2 sqm │ │ 12.0 sqm  │    │ │
│  │ [Measure│  │   │ 16.0 sqm     │ │         │ │           │    │ │
│  │  ]      │  │   └──────────────┘ └─────────┘ └───────────┘    │ │
│  │ [Undo]  │  │                                                   │ │
│  │ [Redo]  │  │   ▲ Floor 2    [2]                               │ │
│  │         │  │   ▼ Floor 0    [G]  ← Floor Navigator            │ │
│  └─────────┘  └───────────────────────────────────────────────────┘ │
│               ┌───────────────────────────────────────────────────┐ │
│               │ Property Panel (selected room)                    │ │
│               │ Type: [Master Bedroom ▼]  Area: 16.0 sqm         │ │
│               │ Width: 4.0m  Depth: 4.0m  Doors: 1  Windows: 2   │ │
│               │ Constraints: ✅ Area OK  ⚠ Orientation suboptimal │ │
│               └───────────────────────────────────────────────────┘ │
│               ┌───────────────────────────────────────────────────┐ │
│               │ Score Panel: 78.4/100  [Compare Candidates]       │ │
│               └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Interaction Handlers

```typescript
// components/editor/LayoutCanvas.tsx

const LayoutCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const { rooms, moveRoom, selectedRoomId, selectRoom } = useLayoutStore();
  const { activeFloor } = useFloorStore();
  const { activeTool } = useEditorStore();
  const { handleRoomDoubleClick } = useVRTransition();

  const currentFloorRooms = useMemo(
    () => Object.values(rooms).filter(r => r.floor === activeFloor),
    [rooms, activeFloor]
  );

  // Snapping system
  const snapToGrid = useCallback((pos: Vector2d): Vector2d => {
    const gridSize = 0.5; // 0.5m grid
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    };
  }, []);

  // Wall-snapping: detect nearby walls from other rooms
  const snapToWalls = useCallback((roomId: string, pos: Vector2d): Vector2d => {
    const SNAP_THRESHOLD = 0.3; // meters
    const otherRooms = currentFloorRooms.filter(r => r.id !== roomId);
    
    let snappedPos = { ...pos };
    
    for (const other of otherRooms) {
      for (const edge of getEdges(other.polygon)) {
        const distance = pointToLineDistance(pos, edge);
        if (distance < SNAP_THRESHOLD) {
          snappedPos = snapPointToLine(pos, edge);
          break;
        }
      }
    }
    
    return snappedPos;
  }, [currentFloorRooms]);

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth}
      height={canvasHeight}
      scaleX={scale}
      scaleY={scale}
      draggable={activeTool === 'pan'}
    >
      <Layer>
        {/* Plot boundary */}
        <PlotBoundary />
        
        {/* Buildable area */}
        <BuildableArea />
        
        {/* Grid overlay */}
        <GridOverlay gridSize={0.5} />
        
        {/* Rooms */}
        {currentFloorRooms.map(room => (
          <RoomShape
            key={room.id}
            room={room}
            isSelected={room.id === selectedRoomId}
            onClick={() => selectRoom(room.id)}
            onDblClick={() => handleRoomDoubleClick(room.id)}
            onDragEnd={(e) => {
              const newPos = snapToWalls(
                room.id,
                snapToGrid({ x: e.target.x(), y: e.target.y() })
              );
              moveRoom(room.id, {
                x: newPos.x - room.polygon[0][0],
                y: newPos.y - room.polygon[0][1],
              });
            }}
            draggable={activeTool === 'move'}
          />
        ))}
        
        {/* Doors and windows */}
        <DoorsLayer floor={activeFloor} />
        <WindowsLayer floor={activeFloor} />
        
        {/* Constraint violation overlays */}
        <ConstraintOverlay floor={activeFloor} />
        
        {/* Dimension labels */}
        <DimensionLabels rooms={currentFloorRooms} />
      </Layer>
    </Stage>
  );
};
```

### 12.3 Client-Side Constraint Validation

```typescript
// lib/constraints.ts

export function validateRoomMove(
  room: Room,
  newPolygon: [number, number][],
  allRooms: Room[],
  buildableArea: [number, number][]
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // 1. Boundary check
  if (!isPolygonInside(newPolygon, buildableArea)) {
    violations.push({
      type: 'boundary_violation',
      severity: 'hard',
      message: `${room.label} extends beyond buildable area`,
      roomId: room.id,
    });
  }

  // 2. Overlap check
  for (const other of allRooms) {
    if (other.id === room.id) continue;
    if (other.floor !== room.floor) continue;
    
    if (polygonsOverlap(newPolygon, other.polygon)) {
      violations.push({
        type: 'overlap',
        severity: 'hard',
        message: `${room.label} overlaps with ${other.label}`,
        roomId: room.id,
        affectedRoomId: other.id,
      });
    }
  }

  // 3. Minimum dimension check
  const dims = getMinMaxDimensions(newPolygon);
  if (dims.minDimension < 2.1) {
    violations.push({
      type: 'min_dimension',
      severity: 'hard',
      message: `${room.label} minimum dimension is ${dims.minDimension.toFixed(1)}m (min: 2.1m)`,
      roomId: room.id,
    });
  }

  // 4. Minimum area check
  const area = polygonArea(newPolygon);
  const minArea = MINIMUM_AREAS[room.type] || 4.0;
  if (area < minArea) {
    violations.push({
      type: 'min_area',
      severity: 'hard',
      message: `${room.label} area is ${area.toFixed(1)}sqm (min: ${minArea}sqm)`,
      roomId: room.id,
    });
  }

  return violations;
}
```

---

## 13. VR Mode Architecture (Three.js)

### 13.1 Scene Graph Structure

```
VR Scene Root
├── Environment
│   ├── Skybox (HDR cubemap)
│   ├── Ambient Light (soft warm, intensity 0.4)
│   └── Directional Light (sun simulation)
├── Room Group
│   ├── Floor Mesh
│   │   └── Material: PBR wood/tile/carpet based on room type
│   ├── Ceiling Mesh
│   │   └── Material: white matte with subtle texture
│   ├── Wall Group
│   │   ├── Wall Mesh N (north wall)
│   │   │   └── Material: painted wall PBR
│   │   ├── Wall Mesh E (with window cutout)
│   │   │   ├── Window Frame (GLTF)
│   │   │   └── Glass Material (transparent + reflection)
│   │   ├── Wall Mesh S
│   │   │   ├── Door Cutout
│   │   │   └── Door Frame (GLTF)
│   │   └── Wall Mesh W
│   ├── Furniture Group
│   │   ├── Bed (GLTF, master_bedroom)
│   │   ├── Nightstand L (GLTF)
│   │   ├── Nightstand R (GLTF)
│   │   ├── Wardrobe (GLTF)
│   │   ├── Dresser (GLTF)
│   │   └── Rug (plane + texture)
│   └── Decor Group
│       ├── Painting (plane + texture)
│       ├── Plant (GLTF)
│       └── Lamp (GLTF + point light)
├── Camera Rig
│   ├── Perspective Camera (FOV 60)
│   └── OrbitControls / FirstPersonControls
└── Post-Processing
    ├── SSAO (subtle)
    ├── Tone Mapping (ACES Filmic)
    └── Anti-aliasing (FXAA)
```

### 13.2 Scene Builder (Backend)

```python
# engines/vr/scene_builder.py

class VRSceneBuilder:
    """Converts 2D room layout into Three.js-consumable scene data."""
    
    ROOM_MATERIAL_PRESETS = {
        "bedroom": {
            "floor": {"type": "wood_oak", "repeat": [4, 4]},
            "walls": {"type": "paint_warm_beige", "roughness": 0.9},
            "ceiling": {"type": "paint_white", "roughness": 0.95},
        },
        "master_bedroom": {
            "floor": {"type": "wood_walnut", "repeat": [3, 3]},
            "walls": {"type": "paint_sage_green", "roughness": 0.85},
            "ceiling": {"type": "paint_white", "roughness": 0.95},
        },
        "living_room": {
            "floor": {"type": "wood_herringbone", "repeat": [6, 6]},
            "walls": {"type": "paint_light_gray", "roughness": 0.9},
            "ceiling": {"type": "paint_white", "roughness": 0.95},
        },
        "kitchen": {
            "floor": {"type": "tile_white_marble", "repeat": [8, 8]},
            "walls": {"type": "tile_subway_white", "roughness": 0.3},
            "ceiling": {"type": "paint_white", "roughness": 0.95},
        },
        "bathroom": {
            "floor": {"type": "tile_gray_stone", "repeat": [10, 10]},
            "walls": {"type": "tile_large_white", "roughness": 0.2},
            "ceiling": {"type": "paint_white", "roughness": 0.95},
        },
    }
    
    def build_scene(
        self, room: Room, floor_layout: Layout, project: Project
    ) -> VRSceneData:
        
        room_height = project.floor_height or 3.0
        
        # 1. Generate room geometry (walls, floor, ceiling)
        geometry = self._build_room_geometry(room, room_height)
        
        # 2. Detect doors and windows from layout
        openings = self._detect_openings(room, floor_layout)
        
        # 3. Apply wall cutouts for openings
        geometry = self._apply_cutouts(geometry, openings)
        
        # 4. Assign materials
        materials = self._assign_materials(room.type)
        
        # 5. Place furniture
        furniture_items = self.furniture_engine.place(room, room_height)
        
        # 6. Configure lighting
        lights = self._configure_lighting(room, openings, room_height)
        
        # 7. Set camera
        camera = self._compute_initial_camera(room, room_height)
        
        return VRSceneData(
            room_id=room.id,
            geometry=geometry,
            openings=openings,
            materials=materials,
            furniture=furniture_items,
            lights=lights,
            camera=camera,
            environment={
                "skybox": "studio_soft",
                "exposure": 1.0,
                "tone_mapping": "aces_filmic",
            },
        )
    
    def _build_room_geometry(self, room: Room, height: float) -> RoomGeometry:
        """Convert 2D polygon to 3D room box with proper winding."""
        vertices_2d = room.polygon  # [[x,y], ...]
        n = len(vertices_2d)
        
        # Floor: triangulated polygon at y=0
        floor_triangles = self._triangulate_polygon(vertices_2d)
        floor_mesh = MeshData(
            vertices=[(v[0], 0, v[1]) for v in vertices_2d],
            triangles=floor_triangles,
            uv=self._compute_floor_uvs(vertices_2d),
            normal=(0, 1, 0),
        )
        
        # Ceiling: same polygon at y=height (flipped normal)
        ceiling_mesh = MeshData(
            vertices=[(v[0], height, v[1]) for v in vertices_2d],
            triangles=[(c, b, a) for a, b, c in floor_triangles],  # Flip winding
            uv=self._compute_floor_uvs(vertices_2d),
            normal=(0, -1, 0),
        )
        
        # Walls: one quad per edge
        wall_meshes = []
        for i in range(n):
            j = (i + 1) % n
            p1 = vertices_2d[i]
            p2 = vertices_2d[j]
            
            wall_width = math.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
            
            wall_meshes.append(WallMeshData(
                edge_index=i,
                vertices=[
                    (p1[0], 0, p1[1]),
                    (p2[0], 0, p2[1]),
                    (p2[0], height, p2[1]),
                    (p1[0], height, p1[1]),
                ],
                width=wall_width,
                height=height,
                normal=self._compute_inward_normal(p1, p2, room.polygon),
                uv=[(0,0), (wall_width,0), (wall_width,height), (0,height)],
            ))
        
        return RoomGeometry(
            floor=floor_mesh,
            ceiling=ceiling_mesh,
            walls=wall_meshes,
        )
```

### 13.3 Frontend VR Component

```tsx
// components/vr/VRScene.tsx

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { EffectComposer, SSAO } from '@react-three/postprocessing';

const VRScene: React.FC<{ sceneData: VRSceneData }> = ({ sceneData }) => {
  return (
    <Canvas
      shadows
      camera={{
        position: sceneData.camera.position,
        fov: sceneData.camera.fov,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Environment preset="apartment" background={false} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#FFF5E6" />
      {sceneData.lights.map((light, i) => (
        <LightComponent key={i} config={light} />
      ))}
      
      {/* Room geometry */}
      <RoomMesh geometry={sceneData.geometry} materials={sceneData.materials} />
      
      {/* Openings (doors, windows) */}
      {sceneData.openings.map((opening, i) => (
        <OpeningModel key={i} config={opening} />
      ))}
      
      {/* Furniture */}
      {sceneData.furniture.map((item, i) => (
        <FurnitureItem key={i} config={item} />
      ))}
      
      {/* Controls */}
      <OrbitControls
        target={sceneData.camera.target}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={1}
        maxDistance={15}
        enableDamping
      />
      
      {/* Post-processing */}
      <EffectComposer>
        <SSAO radius={0.4} intensity={15} luminanceInfluence={0.6} />
      </EffectComposer>
    </Canvas>
  );
};

const FurnitureItem: React.FC<{ config: FurnitureConfig }> = ({ config }) => {
  const { scene } = useGLTF(config.model_url);
  
  return (
    <primitive
      object={scene.clone()}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      castShadow
      receiveShadow
    />
  );
};
```

### 13.4 VR Scene Data JSON

```json
{
  "room_id": "room_1a",
  "geometry": {
    "floor": {
      "vertices": [[0,0,0],[4,0,0],[4,0,4],[0,0,4]],
      "triangles": [[0,1,2],[0,2,3]],
      "uv": [[0,0],[4,0],[4,4],[0,4]]
    },
    "ceiling": {
      "vertices": [[0,3,0],[4,3,0],[4,3,4],[0,3,4]],
      "triangles": [[2,1,0],[3,2,0]]
    },
    "walls": [
      {
        "edge_index": 0,
        "vertices": [[0,0,0],[4,0,0],[4,3,0],[0,3,0]],
        "width": 4.0,
        "height": 3.0,
        "cutouts": [
          {"type": "window", "x": 1.0, "y": 0.9, "w": 1.5, "h": 1.5}
        ]
      }
    ]
  },
  "materials": {
    "floor": {
      "type": "wood_oak",
      "texture_url": "/assets/textures/wood_oak_diffuse.jpg",
      "normal_url": "/assets/textures/wood_oak_normal.jpg",
      "roughness": 0.7,
      "repeat": [4, 4]
    },
    "walls": {
      "type": "paint_warm_beige",
      "color": "#F5E6D3",
      "roughness": 0.9
    }
  },
  "furniture": [
    {
      "id": "f_bed_01",
      "type": "queen_bed",
      "model_url": "/assets/models/queen_bed.glb",
      "position": [2.0, 0, 2.5],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "bounding_box": {"min": [0.7, 0, 1.5], "max": [3.3, 0.6, 3.5]}
    },
    {
      "id": "f_nightstand_01",
      "type": "nightstand",
      "model_url": "/assets/models/nightstand.glb",
      "position": [0.3, 0, 2.5],
      "rotation": [0, 1.5708, 0],
      "scale": [1, 1, 1]
    }
  ],
  "lights": [
    {
      "type": "point",
      "position": [2.0, 2.8, 2.0],
      "intensity": 0.8,
      "color": "#FFF5E6",
      "shadow": true
    },
    {
      "type": "spot",
      "position": [1.0, 2.8, 0.5],
      "target": [1.0, 0, 0.5],
      "intensity": 0.3,
      "angle": 0.6,
      "color": "#FFFFFF"
    }
  ],
  "camera": {
    "position": [2.0, 1.6, -0.5],
    "target": [2.0, 1.2, 2.0],
    "fov": 60
  }
}
```

---

## 14. Furniture Placement Logic

### 14.1 Placement Algorithm

```python
# engines/furniture/placer.py

class FurniturePlacer:
    """Places furniture in rooms based on type-specific rules."""
    
    def place(self, room: Room, room_height: float) -> list[FurnitureItem]:
        rule_set = self._get_rules_for_room_type(room.type)
        
        # 1. Determine available floor area
        floor_polygon = Polygon(room.polygon)
        
        # 2. Identify wall segments and their roles
        wall_analysis = self._analyze_walls(room)
        
        # 3. Place anchor furniture first (bed, sofa, dining table)
        placed = []
        available_area = floor_polygon
        
        for priority_group in rule_set.priority_groups:
            for furniture_rule in priority_group:
                placement = self._find_placement(
                    furniture_rule, room, wall_analysis,
                    available_area, placed
                )
                if placement:
                    placed.append(placement)
                    available_area = available_area.difference(
                        placement.footprint_polygon
                    )
        
        # 4. Fill remaining space with optional items
        optional_items = self._select_optional_items(
            room.type, available_area.area
        )
        for item in optional_items:
            placement = self._find_placement(
                item, room, wall_analysis, available_area, placed
            )
            if placement:
                placed.append(placement)
                available_area = available_area.difference(
                    placement.footprint_polygon
                )
        
        return placed
    
    def _find_placement(
        self, rule: FurnitureRule, room: Room,
        wall_analysis: WallAnalysis, available: Polygon,
        placed: list[FurnitureItem]
    ) -> Optional[FurnitureItem]:
        
        candidates = []
        
        if rule.placement_strategy == "against_wall":
            # Try each eligible wall
            for wall in wall_analysis.walls:
                if not rule.eligible_wall(wall):
                    continue
                
                positions = self._generate_wall_positions(
                    wall, rule.dimensions, rule.wall_offset
                )
                for pos, rotation in positions:
                    footprint = self._compute_footprint(pos, rotation, rule.dimensions)
                    
                    # Check: within room, no overlap, clearance respected
                    if not available.contains(footprint):
                        continue
                    if not self._check_clearance(footprint, rule.clearance, available):
                        continue
                    
                    score = self._score_position(
                        pos, rotation, wall, rule, room, placed
                    )
                    candidates.append((pos, rotation, footprint, score))
        
        elif rule.placement_strategy == "center":
            # Place near room center
            centroid = Polygon(room.polygon).centroid
            for angle in [0, 90, 180, 270]:
                rotation = math.radians(angle)
                pos = (centroid.x, 0, centroid.y)
                footprint = self._compute_footprint(pos, rotation, rule.dimensions)
                
                if available.contains(footprint):
                    score = self._score_position(pos, rotation, None, rule, room, placed)
                    candidates.append((pos, rotation, footprint, score))
        
        elif rule.placement_strategy == "corner":
            corners = self._get_room_corners(room)
            for corner_pos, corner_angle in corners:
                pos = self._offset_from_corner(corner_pos, corner_angle, rule.dimensions)
                footprint = self._compute_footprint(pos, corner_angle, rule.dimensions)
                
                if available.contains(footprint):
                    score = self._score_position(pos, corner_angle, None, rule, room, placed)
                    candidates.append((pos, corner_angle, footprint, score))
        
        if not candidates:
            return None
        
        # Select best position
        best = max(candidates, key=lambda c: c[3])
        pos, rotation, footprint, score = best
        
        return FurnitureItem(
            type=rule.furniture_type,
            model_id=rule.model_id,
            position=pos,
            rotation=(0, rotation, 0),
            scale=(1, 1, 1),
            footprint_polygon=footprint,
            bounding_box=self._compute_bbox(pos, rotation, rule.dimensions),
        )

# Furniture rules per room type
BEDROOM_RULES = FurnitureRuleSet(
    priority_groups=[
        # Priority 1: Anchor furniture
        [
            FurnitureRule(
                furniture_type="bed",
                model_id="queen_bed",
                dimensions=(1.6, 2.1, 0.6),  # w, d, h in meters
                placement_strategy="against_wall",
                eligible_wall=lambda w: not w.has_door and not w.has_window,
                wall_offset=0.05,
                clearance={"front": 0.9, "sides": 0.5},
                priority=1,
            ),
        ],
        # Priority 2: Paired items
        [
            FurnitureRule(
                furniture_type="nightstand",
                model_id="nightstand_modern",
                dimensions=(0.5, 0.4, 0.55),
                placement_strategy="beside",
                reference_item="bed",
                side="both",
                clearance={"front": 0.3},
                priority=2,
            ),
        ],
        # Priority 3: Storage
        [
            FurnitureRule(
                furniture_type="wardrobe",
                model_id="wardrobe_2door",
                dimensions=(1.2, 0.6, 2.2),
                placement_strategy="against_wall",
                eligible_wall=lambda w: not w.has_window,
                wall_offset=0.02,
                clearance={"front": 0.8},
                priority=3,
            ),
        ],
    ]
)
```

---

## 15. Database Schema

### 15.1 Entity Relationship Overview

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  users   │────▶│   projects   │────▶│    plots     │
└──────────┘  1:N└──────────────┘  1:1└──────────────┘
                       │ 1:N
                       ▼
                 ┌──────────────┐     ┌──────────────┐
                 │   layouts    │────▶│   floors     │
                 └──────────────┘  1:N└──────────────┘
                       │ 1:N              │ 1:N
                       ▼                  ▼
                 ┌──────────────┐   ┌──────────────┐
                 │ layout_rooms │   │  floor_rooms  │
                 └──────────────┘   └──────────────┘
                                          │ 1:N
                                          ▼
                                    ┌──────────────────┐
                                    │ room_furniture    │
                                    └──────────────────┘

┌────────────────────┐   ┌─────────────────────┐
│ question_sessions  │   │ furniture_catalog    │
└────────────────────┘   └─────────────────────┘
         │ 1:N
         ▼
┌────────────────────┐
│ question_answers   │
└────────────────────┘
```

### 15.2 Table Definitions

```sql
-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(255),
    avatar_url      VARCHAR(512),
    auth_provider   VARCHAR(50) DEFAULT 'local',  -- local, google, github
    subscription    VARCHAR(50) DEFAULT 'free',    -- free, pro, enterprise
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(50) DEFAULT 'draft',  
                    -- draft, questions_pending, generating, layout_ready, 
                    -- editing, exported, archived
    num_floors      INTEGER NOT NULL CHECK (num_floors >= 1 AND num_floors <= 20),
    parking_config  JSONB DEFAULT '{}',
    gate_direction  VARCHAR(50) NOT NULL,          -- north, south, east, west, custom
    gate_vector     FLOAT[2],                      -- for custom direction [dx, dy]
    road_adjacency  VARCHAR(50)[] DEFAULT '{}',    -- ['north', 'east']
    generation_seed INTEGER DEFAULT 42,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- PLOTS
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE plots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Raw user input (ordered vertices in meters)
    vertices        JSONB NOT NULL,                -- [[x,y], [x,y], ...]
    
    -- PostGIS geometry for spatial queries
    geometry        GEOMETRY(POLYGON, 4326),
    
    -- Computed properties
    area_sqm        FLOAT NOT NULL,
    perimeter_m     FLOAT NOT NULL,
    bounding_box    JSONB NOT NULL,                -- {min_x, min_y, max_x, max_y}
    centroid        JSONB NOT NULL,                -- {x, y}
    
    -- Setback configuration
    setback_config  JSONB DEFAULT '{
        "front": 4.5,
        "rear": 3.0,
        "left": 2.0,
        "right": 2.0
    }',
    buildable_vertices JSONB,                      -- After setback application
    buildable_area_sqm FLOAT,
    
    -- Validation
    is_valid        BOOLEAN DEFAULT TRUE,
    validation_issues JSONB DEFAULT '[]',
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plots_project ON plots(project_id);
CREATE INDEX idx_plots_geometry ON plots USING GIST(geometry);

-- ============================================
-- ROOM REQUIREMENTS (user specification)
-- ============================================
CREATE TABLE room_requirements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_type       VARCHAR(50) NOT NULL,           -- bedroom, kitchen, etc.
    label           VARCHAR(100),                   -- "Master Bedroom", "Kids Room"
    target_area_sqm FLOAT,
    min_area_sqm    FLOAT,
    max_area_sqm    FLOAT,
    quantity         INTEGER DEFAULT 1,
    floor_preference INTEGER,                       -- NULL = any floor
    adjacency_prefs JSONB DEFAULT '[]',            -- ["kitchen", "dining"]
    orientation_pref VARCHAR(50),                   -- "east", "south", etc.
    priority        INTEGER DEFAULT 5,              -- 1=highest, 10=lowest
    custom_constraints JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_room_reqs_project ON room_requirements(project_id);

-- ============================================
-- LAYOUTS (generated candidates)
-- ============================================
CREATE TABLE layouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    candidate_index INTEGER NOT NULL,               -- 0, 1, 2, ... for each project
    is_selected     BOOLEAN DEFAULT FALSE,
    is_user_modified BOOLEAN DEFAULT FALSE,
    
    -- Generation metadata
    generation_strategy VARCHAR(50),                -- bsp, treemap, grid_pack, stochastic
    generation_seed     INTEGER,
    generation_time_ms  INTEGER,
    
    -- Scoring
    total_score     FLOAT,
    dimension_scores JSONB,                         -- {space_util: 85.2, adjacency: 92.0, ...}
    constraint_penalty FLOAT DEFAULT 0,
    pareto_rank     INTEGER,
    
    -- Constraint report
    hard_violations INTEGER DEFAULT 0,
    soft_violations INTEGER DEFAULT 0,
    constraint_report JSONB DEFAULT '{}',
    
    -- Version tracking for user edits
    version         INTEGER DEFAULT 1,
    parent_layout_id UUID REFERENCES layouts(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, candidate_index)
);

CREATE INDEX idx_layouts_project ON layouts(project_id);
CREATE INDEX idx_layouts_selected ON layouts(project_id, is_selected);

-- ============================================
-- FLOORS
-- ============================================
CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id       UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    floor_number    INTEGER NOT NULL,               -- 0 = ground
    label           VARCHAR(100),                   -- "Ground Floor", "First Floor"
    floor_type      VARCHAR(50) DEFAULT 'residential', -- parking, residential, commercial, terrace
    elevation_m     FLOAT NOT NULL DEFAULT 0,
    floor_height_m  FLOAT NOT NULL DEFAULT 3.0,
    
    -- Floor-specific buildable area (may differ due to stepbacks)
    buildable_vertices JSONB,
    buildable_area_sqm FLOAT,
    
    -- Structural
    column_grid     JSONB,                          -- [{x, y}, ...]
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(layout_id, floor_number)
);

CREATE INDEX idx_floors_layout ON floors(layout_id);

-- ============================================
-- ROOMS (placed rooms within a floor)
-- ============================================
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    layout_id       UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    
    room_type       VARCHAR(50) NOT NULL,
    label           VARCHAR(100) NOT NULL,
    
    -- Geometry
    polygon         JSONB NOT NULL,                 -- [[x,y], ...]
    area_sqm        FLOAT NOT NULL,
    centroid        JSONB NOT NULL,                  -- {x, y}
    min_dimension_m FLOAT,
    max_dimension_m FLOAT,
    aspect_ratio    FLOAT,
    
    -- Orientation
    exterior_edges  INTEGER[] DEFAULT '{}',         -- Edge indices touching exterior
    primary_orientation VARCHAR(50),                -- Dominant facing direction
    exterior_wall_length_m FLOAT DEFAULT 0,
    
    -- Style
    style_config    JSONB DEFAULT '{}',             -- Colors, materials for VR
    
    -- Doors and windows attached to this room
    doors           JSONB DEFAULT '[]',             -- [{wall_index, position, width, type}]
    windows         JSONB DEFAULT '[]',             -- [{wall_index, position, width, height, sill}]
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_layout ON rooms(layout_id);
CREATE INDEX idx_rooms_type ON rooms(room_type);

-- ============================================
-- ROOM FURNITURE
-- ============================================
CREATE TABLE room_furniture (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    
    furniture_type  VARCHAR(100) NOT NULL,           -- bed, nightstand, sofa, etc.
    catalog_item_id UUID REFERENCES furniture_catalog(id),
    
    -- Placement
    position_x      FLOAT NOT NULL,
    position_y      FLOAT NOT NULL,                  -- height (usually 0)
    position_z      FLOAT NOT NULL,
    rotation_y      FLOAT DEFAULT 0,                 -- radians around Y axis
    scale           FLOAT DEFAULT 1.0,
    
    -- Bounding
    bbox_min        JSONB NOT NULL,                  -- {x, y, z}
    bbox_max        JSONB NOT NULL,                  -- {x, y, z}
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_room_furniture_room ON room_furniture(room_id);

-- ============================================
-- FURNITURE CATALOG
-- ============================================
CREATE TABLE furniture_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL,           -- seating, sleeping, storage, etc.
    furniture_type  VARCHAR(100) NOT NULL,           -- sofa, bed, wardrobe, etc.
    
    -- 3D model
    model_url       VARCHAR(512) NOT NULL,           -- S3 path to GLTF
    thumbnail_url   VARCHAR(512),
    
    -- Dimensions (meters)
    width           FLOAT NOT NULL,
    depth           FLOAT NOT NULL,
    height          FLOAT NOT NULL,
    
    -- Placement metadata
    applicable_rooms VARCHAR(50)[] NOT NULL,         -- ['bedroom', 'master_bedroom']
    placement_rules JSONB DEFAULT '{}',
    
    -- Style
    style_tags      VARCHAR(50)[] DEFAULT '{}',      -- ['modern', 'minimalist']
    color_variants  JSONB DEFAULT '[]',
    
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_furniture_type ON furniture_catalog(furniture_type);
CREATE INDEX idx_furniture_rooms ON furniture_catalog USING GIN(applicable_rooms);

-- ============================================
-- QUESTION SESSIONS
-- ============================================
CREATE TABLE question_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(50) DEFAULT 'pending',   -- pending, answered, processed
    questions       JSONB NOT NULL,                  -- Array of question objects
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES question_sessions(id) ON DELETE CASCADE,
    question_id     VARCHAR(100) NOT NULL,
    answer_value    JSONB NOT NULL,
    derived_constraints JSONB DEFAULT '[]',          -- Constraints derived from this answer
    answered_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXPORTS
-- ============================================
CREATE TABLE exports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id       UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    format          VARCHAR(50) NOT NULL,            -- pdf, dxf, png, obj
    file_url        VARCHAR(512),
    file_size_bytes BIGINT,
    status          VARCHAR(50) DEFAULT 'pending',   -- pending, processing, ready, failed
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);
```

---

## 16. API Endpoint Design

### 16.1 RESTful Endpoints

| Method | Endpoint | Description | Request | Response |
|---|---|---|---|---|
| **Projects** |||||
| `POST` | `/api/v1/projects` | Create new project | `ProjectCreate` | `Project` |
| `GET` | `/api/v1/projects` | List user projects | Query params | `Project[]` |
| `GET` | `/api/v1/projects/{id}` | Get project details | - | `ProjectDetail` |
| `PATCH` | `/api/v1/projects/{id}` | Update project | `ProjectUpdate` | `Project` |
| `DELETE` | `/api/v1/projects/{id}` | Delete project | - | `204` |
| **Plots** |||||
| `POST` | `/api/v1/projects/{id}/plot` | Submit plot polygon | `PlotCreate` | `PlotValidation` |
| `GET` | `/api/v1/projects/{id}/plot` | Get plot data | - | `PlotDetail` |
| `PATCH` | `/api/v1/projects/{id}/plot` | Update plot | `PlotUpdate` | `PlotValidation` |
| **Questions** |||||
| `GET` | `/api/v1/projects/{id}/questions` | Get pending questions | - | `QuestionSet` |
| `POST` | `/api/v1/projects/{id}/questions/answers` | Submit answers | `AnswerSet` | `QuestionResult` |
| **Layouts** |||||
| `POST` | `/api/v1/projects/{id}/layouts/generate` | Trigger generation | `GenerateConfig` | `JobStatus` |
| `GET` | `/api/v1/projects/{id}/layouts` | List candidates | - | `LayoutSummary[]` |
| `GET` | `/api/v1/projects/{id}/layouts/{lid}` | Get layout detail | - | `LayoutDetail` |
| `POST` | `/api/v1/projects/{id}/layouts/{lid}/select` | Select candidate | - | `Layout` |
| `PATCH` | `/api/v1/projects/{id}/layouts/{lid}` | Update (user edit) | `LayoutUpdate` | `Layout` |
| **Floors** |||||
| `GET` | `/api/v1/projects/{id}/layouts/{lid}/floors` | List floors | - | `Floor[]` |
| `GET` | `/api/v1/projects/{id}/layouts/{lid}/floors/{fn}` | Get floor detail | - | `FloorDetail` |
| **Rooms** |||||
| `GET` | `/api/v1/layouts/{lid}/rooms` | All rooms in layout | - | `Room[]` |
| `PATCH` | `/api/v1/rooms/{rid}` | Update room | `RoomUpdate` | `Room` |
| `POST` | `/api/v1/layouts/{lid}/rooms` | Add room | `RoomCreate` | `Room` |
| `DELETE` | `/api/v1/rooms/{rid}` | Delete room | - | `204` |
| **VR** |||||
| `GET` | `/api/v1/vr/scene/{pid}/rooms/{rid}` | Get VR scene data | - | `VRSceneData` |
| **Scoring** |||||
| `GET` | `/api/v1/layouts/{lid}/score` | Get detailed score | - | `ScoringResult` |
| `POST` | `/api/v1/layouts/{lid}/rescore` | Rescore after edits | - | `ScoringResult` |
| **Export** |||||
| `POST` | `/api/v1/layouts/{lid}/export` | Generate export | `ExportConfig` | `JobStatus` |
| `GET` | `/api/v1/exports/{eid}` | Get export file | - | `ExportResult` |

### 16.2 WebSocket Endpoint

```
WS /ws/editor/{project_id}

Client → Server Messages:
  { "type": "room_move", "room_id": "...", "delta": {"x": 1.0, "y": 0.5} }
  { "type": "room_resize", "room_id": "...", "new_polygon": [[...]] }
  { "type": "room_add", "room": { ... } }
  { "type": "room_delete", "room_id": "..." }
  { "type": "floor_switch", "floor_number": 2 }
  { "type": "request_rescore" }

Server → Client Messages:
  { "type": "constraint_update", "violations": [...] }
  { "type": "score_update", "score": {...} }
  { "type": "layout_sync", "layout": {...} }
  { "type": "structural_warning", "issues": [...] }
  { "type": "error", "message": "..." }
```

### 16.3 Sample API Payloads

**POST `/api/v1/projects/{id}/plot`**

```json
{
  "vertices": [
    [0.0, 0.0],
    [15.2, 0.0],
    [16.0, 8.5],
    [12.0, 14.0],
    [5.0, 13.5],
    [0.0, 10.0]
  ],
  "unit": "meters",
  "gate_edge_index": 0,
  "road_edges": [0, 1],
  "setback_override": {
    "front": 5.0,
    "rear": 3.0,
    "left": 2.5,
    "right": 2.5
  }
}
```

**Response — `PlotValidation`**

```json
{
  "valid": true,
  "plot": {
    "id": "plot_9f8e7d",
    "vertices": [[0,0],[15.2,0],[16,8.5],[12,14],[5,13.5],[0,10]],
    "area_sqm": 168.35,
    "perimeter_m": 54.8,
    "bounding_box": {"min_x": 0, "min_y": 0, "max_x": 16, "max_y": 14},
    "centroid": {"x": 8.03, "y": 7.23}
  },
  "buildable_area": {
    "vertices": [[2.5,5.0],[13.0,5.0],[13.5,8.0],[11.0,11.5],[5.5,11.2],[2.5,8.5]],
    "area_sqm": 98.2,
    "coverage_ratio": 0.583
  },
  "warnings": [
    "Vertex 2 creates an angle of 142° — acceptable but may reduce layout efficiency."
  ],
  "errors": []
}
```

**POST `/api/v1/projects/{id}/layouts/generate`**

```json
{
  "room_requirements": [
    {"type": "living_room", "target_area": 20, "quantity": 1},
    {"type": "master_bedroom", "target_area": 16, "quantity": 1},
    {"type": "bedroom", "target_area": 12, "quantity": 2},
    {"type": "kitchen", "target_area": 10, "quantity": 1},
    {"type": "bathroom", "target_area": 5, "quantity": 2},
    {"type": "dining", "target_area": 10, "quantity": 1},
    {"type": "study", "target_area": 8, "quantity": 1}
  ],
  "num_candidates": 10,
  "optimization_level": "high",
  "seed": 42
}
```

**Response — `JobStatus`**

```json
{
  "job_id": "job_a1b2c3",
  "status": "processing",
  "estimated_time_seconds": 8,
  "progress_url": "/api/v1/jobs/job_a1b2c3"
}
```

---

## 17. Data Flow Example

### 17.1 Complete Flow: Plot Input → VR Output

```
USER                  FRONTEND              BACKEND                    DATABASE
 │                       │                     │                          │
 │  Draw polygon         │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │                     │                          │
 │                       │  POST /plot         │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │                          │
 │                       │                     │  GeometryEngine          │
 │                       │                     │  .validate()             │
 │                       │                     │  .compute_setbacks()     │
 │                       │                     │                          │
 │                       │                     │  Store plot ────────────▶│
 │                       │                     │                          │
 │                       │  PlotValidation     │                          │
 │                       │◀────────────────────│                          │
 │                       │                     │                          │
 │  Set rooms, floors    │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │                     │                          │
 │                       │  POST /rooms        │                          │
 │                       │────────────────────▶│  Store requirements ───▶│
 │                       │                     │                          │
 │                       │  GET /questions     │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │  QuestionEngine          │
 │                       │                     │  .analyze_gaps()         │
 │                       │                     │  .generate_questions()   │
 │                       │                     │                          │
 │  Answer questions     │  QuestionSet        │                          │
 │                       │◀────────────────────│                          │
 │──────────────────────▶│                     │                          │
 │                       │  POST /answers      │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │  AnswerProcessor         │
 │                       │                     │  .process() → constraints│
 │                       │                     │                          │
 │                       │                     │  (May loop for more Qs)  │
 │                       │                     │                          │
 │  Click "Generate"     │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  POST /generate     │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │  Celery Task:            │
 │                       │  JobStatus          │  ┌────────────────────┐  │
 │                       │◀────────────────────│  │ Pipeline.execute() │  │
 │                       │                     │  │                    │  │
 │  (polling/WS)         │                     │  │ 1. Compile constr. │  │
 │                       │                     │  │ 2. Partition space  │  │
 │                       │                     │  │ 3. Assign rooms    │  │
 │                       │                     │  │ 4. Refine (SA)     │  │
 │                       │                     │  │ 5. Score candidates│  │
 │                       │                     │  │ 6. Pareto rank     │  │
 │                       │                     │  │ 7. Multi-floor     │  │
 │                       │                     │  │    alignment       │  │
 │                       │                     │  │ 8. Place doors/    │  │
 │                       │                     │  │    windows         │  │
 │                       │                     │  └─────────┬──────────┘  │
 │                       │                     │            │             │
 │                       │                     │  Store layouts ─────────▶│
 │                       │                     │                          │
 │                       │  GET /layouts       │                          │
 │                       │────────────────────▶│  Fetch layouts ◀────────│
 │                       │  LayoutSummary[]    │                          │
 │                       │◀────────────────────│                          │
 │                       │                     │                          │
 │  View candidates      │                     │                          │
 │  Compare scores       │                     │                          │
 │  Select best          │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  POST /select       │                          │
 │                       │────────────────────▶│  Mark selected ────────▶│
 │                       │                     │                          │
 │  Edit in 2D editor    │                     │                          │
 │  (move/resize rooms)  │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  WS: room_move      │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │  ConstraintEngine        │
 │                       │                     │  .evaluate()             │
 │                       │  WS: constraint_upd │                          │
 │                       │◀────────────────────│                          │
 │                       │                     │                          │
 │  Switch floor (▲/▼)   │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  GET /floors/{n}    │                          │
 │                       │────────────────────▶│  Fetch floor ◀──────────│
 │                       │  FloorDetail        │                          │
 │                       │◀────────────────────│                          │
 │                       │                     │                          │
 │  Double-click room    │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  GET /vr/scene/     │                          │
 │                       │    room/{rid}       │                          │
 │                       │────────────────────▶│                          │
 │                       │                     │  VRSceneBuilder          │
 │                       │                     │  .build_scene()          │
 │                       │                     │  FurniturePlacer         │
 │                       │                     │  .place()                │
 │                       │                     │                          │
 │                       │  VRSceneData        │                          │
 │                       │◀────────────────────│                          │
 │                       │                     │                          │
 │  VR Walkthrough       │                     │                          │
 │  (Three.js renders)   │                     │                          │
 │◀──────────────────────│                     │                          │
 │                       │                     │                          │
 │  Export PDF           │                     │                          │
 │──────────────────────▶│                     │                          │
 │                       │  POST /export       │                          │
 │                       │────────────────────▶│  Celery: generate PDF   │
 │                       │                     │  Upload to S3 ──────────▶│
 │                       │  ExportResult       │                          │
 │                       │◀────────────────────│                          │
 │  Download             │                     │                          │
 │◀──────────────────────│                     │                          │
```

---

## 18. Scalability Plan

### 18.1 Performance Targets

| Metric | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Concurrent Users | 500 | 5,000 | 50,000 |
| Layout Generation (P95) | < 10s | < 5s | < 3s |
| VR Scene Load (P95) | < 3s | < 2s | < 1s |
| Editor Interaction (P95) | < 200ms | < 100ms | < 50ms |
| API Response (P95) | < 500ms | < 200ms | < 100ms |
| Database Queries (P95) | < 100ms | < 50ms | < 20ms |

### 18.2 Horizontal Scaling Strategy

```
Phase 1: Single-Server Optimized
┌─────────────────────────────────────┐
│  Single Server (8 vCPU, 32GB RAM)   │
│                                     │
│  ┌───────────┐  ┌───────────────┐   │
│  │ Next.js   │  │ FastAPI       │   │
│  │ (port 3k) │  │ (port 8k)    │   │
│  └───────────┘  └───────────────┘   │
│  ┌───────────┐  ┌───────────────┐   │
│  │ PostgreSQL│  │ Redis         │   │
│  └───────────┘  └───────────────┘   │
│  ┌───────────────────────────────┐   │
│  │ Celery Workers (4 processes)  │   │
│  └───────────────────────────────┘   │
└─────────────────────────────────────┘

Phase 2: Service Separation
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ CDN     │  │ Load     │  │ Frontend     │
│ (Assets)│  │ Balancer │  │ (2 replicas) │
└─────────┘  └────┬─────┘  └──────────────┘
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
     ┌────────┐┌────────┐┌────────────────┐
     │API (3) ││Worker  ││ PostgreSQL     │
     │replicas││(6)     ││ (primary +     │
     └────────┘└────────┘│  read replica) │
                         └────────────────┘

Phase 3: Full Kubernetes
┌──────────────────────────────────────────────┐
│                Kubernetes Cluster             │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Frontend  │  │ API Pods │  │ Worker    │  │
│  │ Pods (HPA)│  │ (HPA)   │  │ Pods (HPA)│  │
│  │ min:2     │  │ min:3   │  │ min:4     │  │
│  │ max:10    │  │ max:20  │  │ max:30    │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ PgBouncer│  │ Redis    │  │ MinIO     │  │
│  │ + PG     │  │ Cluster  │  │ Cluster   │  │
│  │ Primary  │  │ (3 nodes)│  │           │  │
│  │ + 2 Read │  └──────────┘  └───────────┘  │
│  └──────────┘                                │
└──────────────────────────────────────────────┘
```

### 18.3 Caching Strategy

| Cache Layer | Technology | TTL | Content |
|---|---|---|---|
| CDN Edge | CloudFront/Vercel Edge | 30 days | Static assets, 3D models, textures |
| API Response | Redis | 5 min | Layout listing, project metadata |
| Layout Candidates | Redis | 1 hour | Generated candidates pre-selection |
| VR Scene Data | Redis | 15 min | Built scene JSON (invalidated on edit) |
| Geometry Computations | Redis | Until plot change | Setback polygons, buildable areas |
| Furniture Catalog | Application Memory | 1 hour | Catalog query results |
| LLM Responses | Redis | 30 min | Question generation results |

### 18.4 Computation Optimization

```python
# Parallel layout generation using process pool
import concurrent.futures

async def generate_layouts_parallel(
    buildable_area, room_specs, constraints, num_candidates=20
):
    seeds = list(range(num_candidates))
    
    with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(
                generate_single_candidate,
                buildable_area, room_specs, constraints, seed
            ): seed for seed in seeds
        }
        
        candidates = []
        for future in concurrent.futures.as_completed(futures):
            try:
                candidate = future.result(timeout=10)
                if candidate:
                    candidates.append(candidate)
            except Exception as e:
                logger.warning(f"Candidate generation failed: {e}")
    
    return candidates
```

---

## 19. Future AI Expansion

### 19.1 Reinforcement Learning for Layout Generation

```
┌──────────────────────────────────────────────────────┐
│              RL Layout Agent (Future)                  │
│                                                      │
│  State:                                              │
│    • Current partial layout (room placements so far) │
│    • Remaining rooms to place                        │
│    • Constraint satisfaction status                   │
│    • Available free space geometry                   │
│                                                      │
│  Actions:                                            │
│    • Place room at position (x, y, w, h, rotation)   │
│    • Split current region                            │
│    • Adjust room dimensions                          │
│    • Swap two rooms                                  │
│                                                      │
│  Reward:                                             │
│    R = α·S_util + β·S_adj + γ·S_light + δ·S_priv    │
│        - λ·P_constraint_violations                   │
│        + bonus for completing all rooms               │
│        - step_penalty (encourages efficiency)         │
│                                                      │
│  Architecture:                                       │
│    Policy Network:  CNN (spatial) + MLP (constraints) │
│    Value Network:   Same backbone, scalar output      │
│    Algorithm:       PPO with curriculum learning      │
│                                                      │
│  Training:                                           │
│    Phase A: Random polygons, simple constraints       │
│    Phase B: Real-world plot shapes, full constraints  │
│    Phase C: Fine-tune on user-selected layouts        │
│             (RLHF — learn user preferences)           │
└──────────────────────────────────────────────────────┘
```

### 19.2 Computer Vision: Sketch-to-Plan

```
Future Module: SketchInterpreter

Input:  Photo/scan of hand-drawn floor plan sketch
Output: Structured room layout with dimensions

Pipeline:
1. Image preprocessing (deskew, denoise, binarize)
2. Wall detection (Hough lines + connected components)
3. Room segmentation (flood fill between walls)
4. Text/label OCR (room names, dimensions)
5. Symbol detection (door arcs, window marks, fixtures)
6. Dimension extraction and scale calibration
7. Output: structured layout JSON

Technology: YOLOv8 for symbol detection + 
            SAM for room segmentation + 
            PaddleOCR for text extraction
```

### 19.3 Generative AI for Design Styles

```
Future Module: StyleTransfer

Given a base layout, apply different architectural styles:
  • Modern Minimalist
  • Traditional / Classical
  • Industrial Loft
  • Scandinavian
  • Japanese Zen
  • Mediterranean

Each style affects:
  • Material palette (VR mode)
  • Furniture selection
  • Window proportions
  • Ceiling treatments
  • Color schemes
  • Decorative elements

Implementation: Fine-tuned diffusion model for interior 
               image generation + style-conditioned 
               furniture/material selection rules
```

### 19.4 LLM-Powered Layout Explanation

```python
# Future: Explain why a layout was generated this way

class LayoutExplainer:
    async def explain(self, layout: Layout, context: PipelineContext) -> str:
        prompt = f"""You are an architectural consultant explaining a floor plan 
        to a homeowner. Given the following layout data and design decisions, 
        provide a clear, friendly explanation of:
        
        1. Why rooms are positioned where they are
        2. Key design advantages of this layout
        3. Trade-offs that were made
        4. How the layout addresses their requirements
        
        Layout Data: {json.dumps(layout.to_summary())}
        User Requirements: {json.dumps(context.room_requirements)}
        Scoring: {json.dumps(layout.scoring_result.to_dict())}
        Constraints Applied: {json.dumps(context.compiled_constraints)}
        """
        
        return await self.llm.generate(prompt, max_tokens=1000)
```

### 19.5 Vector Database for Layout Similarity Search

```
Future Integration: Layout Embedding & Search

Store completed layouts as vector embeddings for:
  • "Find similar layouts" — given a partial spec, retrieve 
    nearest existing layouts as starting points
  • Layout recommendation — users with similar plots 
    and requirements preferred this layout
  • Anomaly detection — flag unusual layouts that 
    deviate significantly from corpus

Embedding Model: Custom encoder trained on layout features
  Input: (polygon, room_types, room_positions, room_areas, adjacency_graph)
  Output: 256-dim embedding vector
  
Storage: pgvector extension or Pinecone
```

---

## 20. Development Phases

### Phase 1: Foundation (Weeks 1–8)

**Goal:** Core pipeline working end-to-end with rectangular plots.

| Week | Frontend | Backend | Infra |
|---|---|---|---|
| 1–2 | Next.js scaffold, auth, project CRUD | FastAPI scaffold, DB schema, migrations | Docker Compose, CI/CD |
| 3–4 | Plot input canvas (Konva.js), rectangular polygons | Geometry engine (validation, setback, area) | PostgreSQL + PostGIS setup |
| 5–6 | Room requirement form, basic question wizard | Constraint engine (hard constraints), space partitioner | Redis, Celery setup |
| 7–8 | Candidate list view, basic score display | Layout generator (BSP + grid), scoring engine, API endpoints | S3/MinIO for assets |

**Deliverable:** User draws a rectangle, specifies rooms, gets 5 layout candidates with scores.

### Phase 2: Intelligence (Weeks 9–16)

**Goal:** Irregular polygons, smart questions, interactive editor, multi-floor.

| Week | Frontend | Backend | AI |
|---|---|---|---|
| 9–10 | Irregular polygon drawing tool, polygon editing | Irregular polygon geometry, convex decomposition | LLM question engine integration |
| 11–12 | Interactive 2D editor (drag, resize, snap) | WebSocket editor sync, live constraint validation | Dynamic question generation |
| 13–14 | Floor navigator (▲/▼), multi-floor view | Multi-floor layout generation, structural alignment | Answer → constraint mapping |
| 15–16 | Candidate comparison radar chart, score breakdown | Simulated annealing refinement, Pareto ranking | Layout explanation (LLM) |

**Deliverable:** Full irregular polygon support, intelligent Q&A, editable multi-floor layouts.

### Phase 3: Immersion (Weeks 17–24)

**Goal:** VR mode, furniture, export, polish.

| Week | Frontend | Backend | Assets |
|---|---|---|---|
| 17–18 | VR scene renderer (React Three Fiber), room transition | VR scene builder, material mapping | Source GLTF furniture models (30+) |
| 19–20 | Furniture visualization in VR, orbit + FP camera | Furniture placement engine, collision detection | Textures (wood, tile, paint, fabric) |
| 21–22 | Post-processing (SSAO, tone mapping), VR polish | Export pipeline (PDF, PNG, DXF) | Additional furniture (50+), HDR environments |
| 23–24 | Performance optimization, mobile responsive, UX polish | Load testing, caching optimization, monitoring | Documentation, onboarding flow |

**Deliverable:** Production-ready platform with full VR walkthrough and export.

### Phase 4: Scale & AI (Weeks 25–36) — Future

| Quarter | Focus |
|---|---|
| Q1 Post-Launch | User feedback integration, RL training data collection, performance tuning |
| Q2 Post-Launch | Sketch-to-plan CV module, style transfer, vector similarity search |
| Q3 Post-Launch | RL layout agent v1, collaborative editing, real-time multiplayer |

---

## Appendix A: Environment Variables

```env
# Application
APP_ENV=production
APP_SECRET_KEY=<random-256-bit>
API_BASE_URL=https://api.archplan.io
FRONTEND_URL=https://app.archplan.io

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/archplan
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=archplan-assets
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<secret>

# LLM
LLM_PROVIDER=openai           # openai, anthropic, litellm
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000

# Auth
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=https://app.archplan.io
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>

# Feature Flags
ENABLE_VR_MODE=true
ENABLE_EXPORT=true
ENABLE_QUESTION_ENGINE=true
MAX_CANDIDATES_PER_GENERATION=20
MAX_FLOORS=20
```

## Appendix B: Monitoring & Observability

```
┌─────────────────────────────────────────────┐
│            Observability Stack               │
│                                             │
│  Metrics:    Prometheus + Grafana            │
│  Logging:    Structured JSON → Loki          │
│  Tracing:    OpenTelemetry → Jaeger          │
│  Errors:     Sentry (frontend + backend)     │
│  Uptime:     Healthcheck endpoints           │
│                                             │
│  Key Dashboards:                             │
│  ├── Layout Generation Performance           │
│  │   • Generation time histogram             │
│  │   • Candidate quality distribution        │
│  │   • Constraint violation rates            │
│  ├── API Performance                         │
│  │   • Request latency (P50/P95/P99)         │
│  │   • Error rates by endpoint               │
│  │   • Active WebSocket connections          │
│  ├── User Engagement                         │
│  │   • Projects created / day                │
│  │   • Layouts generated / day               │
│  │   • VR sessions / day                     │
│  │   • Editor interaction frequency          │
│  └── Infrastructure                          │
│      • CPU / Memory / Disk                   │
│      • Database query performance            │
│      • Redis hit rates                       │
│      • Celery queue depth                    │
└─────────────────────────────────────────────┘
```

---

*This document is a living artifact. All architectural decisions are subject to revision based on user feedback, performance data, and evolving requirements. Major changes require architecture review and version bump.*

**Document Version History:**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2025-06-01 | Architecture Team | Initial draft |
| 1.5.0 | 2025-06-20 | Architecture Team | Added VR architecture, furniture engine |
| 2.0.0 | 2025-07-10 | Architecture Team | Complete rewrite — added scoring formulas, constraint taxonomy, RL expansion plan, detailed pseudocode |
```