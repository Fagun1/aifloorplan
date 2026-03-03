

# FRONTEND_PRODUCT_VISION.md

---

## ARKITEKTA STUDIO — Frontend Product Vision & Experience Architecture

**Version:** 1.0  
**Status:** Canonical Reference  
**Audience:** Frontend Engineers, Designers, Product Leadership  
**Last Updated:** June 2025

---

## 1. Product Philosophy

### 1.1 What the Studio Is

Arkitekta Studio is a **calm, precise, spatial instrument** for generating architectural floor plans. It is a digital drafting board — not a dashboard, not a data tool, not an engineering console. Every pixel exists in service of one experience: the user draws a plot, and a beautiful architectural plan appears.

The studio is the quiet confidence of a well-lit architecture firm's workspace translated into software. The interface should feel like **vellum under good light** — warm, minimal, and focused entirely on the spatial artifact being created.

It is a tool that respects the intelligence of its user by hiding its own complexity. The AI, the constraint engine, the scoring logic, the deterministic seed machinery — none of this is the user's concern. The user's concern is space, proportion, flow, and livability. The studio serves that concern and nothing else.

### 1.2 What the Studio Is NOT

- It is **not** a developer dashboard. No metrics, no debug overlays, no raw JSON.
- It is **not** a research prototype. No exposed seed values, no candidate counts, no Pareto charts.
- It is **not** a settings panel. Configuration is minimal, purposeful, and secondary to the spatial canvas.
- It is **not** a dark-themed IDE. No monospace fonts, no terminal aesthetics, no dense information panels.
- It is **not** a 3D playground. It is a deliberate, refined 2D drafting experience.
- It is **not** a toy. It does not use playful colors, gamified interactions, or casual UI patterns.

### 1.3 Emotional Tone

The emotional register of the studio is:

| Quality | Description |
|---|---|
| **Calm** | Nothing blinks, pulses, bounces, or demands attention unnecessarily. |
| **Confident** | The interface does not over-explain itself. Controls are discoverable but not loud. |
| **Precise** | Every line, label, and dimension feels measured and intentional. |
| **Spatial** | The dominant experience is looking at architectural space, not at UI chrome. |
| **Premium** | The product feels like it costs $200/month, even if it doesn't. |
| **Trustworthy** | The deterministic engine produces reliable results. The UI must reflect that reliability through visual consistency. |

If a user screenshots their generated floor plan and sends it to a friend, the friend should think it came from an architect — not from a software tool.

### 1.4 Target User Mindset

The primary user is someone who **thinks spatially but is not a CAD expert**. They may be:

- An architect exploring massing options quickly
- A developer evaluating plot feasibility
- A homeowner imagining their future floor plan
- A real estate professional validating a site

They expect:
- Immediate visual results
- Professional-quality output
- No learning curve beyond basic drawing interaction
- No need to understand what happens under the hood

---

## 2. Interaction Model

### 2.1 First-Time User Flow

```
Landing → Empty Drafting Board → Draw Plot Polygon → Set Parameters → Generate → View Plan
```

**Step-by-step experience:**

1. User arrives at a **white canvas** with a faint grid. The center of the screen is empty. A single, understated prompt reads: *"Draw your plot boundary to begin."* or a gentle tooltip anchored to the cursor.
2. User clicks to place polygon vertices on the canvas. Each click places a vertex with a subtle snap and a thin guide line. The polygon closes when the user clicks near the origin point or double-clicks.
3. Upon closing the polygon, a **minimal parameter drawer** slides in from the right — not a modal, not a popup. It asks only essential questions: number of floors, approximate area allocation, basic room requirements. These questions come from the backend question engine but are presented as clean, human-readable form fields.
4. User clicks **"Generate Plan"** — a single prominent action button.
5. A brief, elegant loading state appears — not a spinner, but a subtle architectural sketch animation or a calm progress indication. Duration is honest; no artificial delays, no premature rendering.
6. The generated floor plan fades in on the canvas, precisely rendered, with the polygon boundary now serving as the exterior wall.
7. The parameter drawer collapses. The plan is the hero.

### 2.2 Returning User Flow

```
Landing → Project Gallery → Select Project → Canvas with Saved Plan → Modify or Regenerate
```

- Returning users see a **minimal project gallery** — cards showing plan thumbnails, plot shape, date, and basic metadata.
- Selecting a project opens the studio with the previously generated plan already rendered.
- The user can modify the polygon, change parameters, or regenerate.
- No onboarding friction on return.

### 2.3 Generation Flow

The generation interaction must feel **instantaneous and inevitable** — like the plan was always there, waiting to be revealed.

- **Trigger:** Single button press ("Generate Plan").
- **Loading:** The canvas dims slightly (2–5% opacity reduction). A thin progress bar — architectural in character, not a tech spinner — appears at the top of the canvas or along the polygon edge. No percentage numbers. No ETA.
- **Arrival:** The plan renders in one clean pass. No progressive room-by-room animation. No jittery drawing effect. The plan appears fully formed.
- **Post-generation:** The Generate button transforms into a subtle "Regenerate" option. The AI analysis becomes available as a slide-in panel. Floor navigation appears if multi-floor.

### 2.4 Floor Switching Flow

- A **vertical pill-shaped floor selector** appears on the left edge of the canvas when the plan has multiple floors.
- Each floor is represented by a labeled pill: `G`, `1`, `2`, etc.
- The active floor is highlighted with a filled state; others are outlined.
- Clicking a floor triggers an instant swap — no animation between floors. The plan simply replaces. This reinforces determinism: each floor is a discrete, complete artifact.
- A subtle label in the canvas margin reads "Ground Floor" / "First Floor" / etc.

### 2.5 Furniture Toggling

- A small **toggle icon** (chair/sofa symbol) in the canvas toolbar enables or disables furniture rendering.
- Default state: **furniture OFF.** The plan is shown in pure architectural mode first.
- When toggled on, furniture symbols fade in at 60% opacity — they must never compete with walls and room labels.
- Furniture is symbolic, not realistic. Rectangles for beds, arcs for dining tables, simple sink/toilet/tub symbols for wet rooms.

### 2.6 Zoom Behavior

- **Scroll-to-zoom** centered on cursor position.
- **Pinch-to-zoom** on trackpad and touch devices.
- **Fit-to-view** button (a small square-in-square icon) resets the viewport to show the entire plan with comfortable padding.
- Zoom range: 25% to 400%.
- No zoom percentage displayed unless in Advanced Mode.
- Pan via click-and-drag on empty canvas space (not on plan elements).
- The grid (if visible) scales with zoom, showing finer subdivisions at higher zoom levels.

### 2.7 AI Analysis Behavior

- After plan generation, a small **"AI Insights"** tab appears at the right edge of the canvas — a vertical tab label, not a button.
- Clicking it slides open a **narrow right panel** (320px max) with the LLM-generated explanation of the layout.
- The analysis is presented as clean prose paragraphs — not bullet points of metrics. It reads like an architect's brief: *"The living area is positioned along the southern boundary to maximize natural light. The kitchen maintains direct access to both the dining area and the rear entrance..."*
- No scores, no percentages, no radar charts in User Mode. These belong in Advanced Mode only.
- The panel can be dismissed. It never auto-opens. It never overlays the plan.

---

## 3. UI Architecture

### 3.1 Page Hierarchy

```
/                     → Landing / Project Gallery
/studio               → Main Studio Canvas (Draft + Plan modes)
/studio/[projectId]   → Specific Project Studio
/settings             → Account & Preferences (minimal)
```

The studio is a **single-page spatial application**. There are no multi-step wizards, no nested routes within the studio, no page transitions during the core workflow. The canvas is persistent. Panels slide in and out. The URL reflects state but the experience is fluid.

### 3.2 Component Zones

The studio screen is divided into five conceptual zones:

```
┌─────────────────────────────────────────────────────┐
│  TOP BAR (project name, mode indicator, account)    │
├────┬────────────────────────────────────────┬───────┤
│    │                                        │       │
│ L  │                                        │  R    │
│ E  │          CANVAS ZONE                   │  I    │
│ F  │       (Konva Stage)                    │  G    │
│ T  │                                        │  H    │
│    │       Primary interaction surface      │  T    │
│ R  │       100% of remaining space          │       │
│ A  │                                        │  P    │
│ I  │                                        │  A    │
│ L  │                                        │  N    │
│    │                                        │  E    │
│    │                                        │  L    │
├────┴────────────────────────────────────────┴───────┤
│  BOTTOM BAR (status, scale indicator, zoom)         │
└─────────────────────────────────────────────────────┘
```

**Zone specifications:**

| Zone | Purpose | Behavior |
|---|---|---|
| **Top Bar** | Project identity, mode switching, minimal actions | Always visible. 48px height. Near-invisible. |
| **Left Rail** | Floor selector, primary tools (draw, select) | Always visible in Plan mode. 48px width. Icon-only. |
| **Canvas Zone** | The drafting board. Polygon drawing, plan rendering. | Fills all remaining space. White/off-white background. |
| **Right Panel** | Parameters, AI analysis, room details | Slides in/out. 320px width. Only visible when invoked. |
| **Bottom Bar** | Scale bar, zoom controls, coordinate readout | Always visible. 32px height. Subtle. |

### 3.3 Studio Layout Structure

The canvas zone operates on a **layered rendering model** (via Konva):

| Layer (bottom to top) | Content |
|---|---|
| Layer 0 — Grid | Subtle drafting grid (optional, toggleable) |
| Layer 1 — Plot | The user's polygon boundary, shown as a dashed or thin line before generation |
| Layer 2 — Exterior Walls | Thick filled walls following the polygon |
| Layer 3 — Interior Walls | Thinner partition walls |
| Layer 4 — Doors | Door openings with swing arcs |
| Layer 5 — Furniture | Symbolic furniture (toggleable) |
| Layer 6 — Labels | Room names, dimensions |
| Layer 7 — Annotations | AI callouts, dimension lines (if enabled) |
| Layer 8 — Interaction | Selection highlights, hover states, drawing cursors |

Layers are rendered strictly in this order. No z-index conflicts. No overlapping interactive zones.

### 3.4 Separation of Modes (User vs Advanced)

The studio has two experience tiers:

**User Mode (default):**
- Clean canvas with plan rendering
- Minimal toolbar
- No exposed metrics, seeds, scores, or engine internals
- AI analysis as prose
- Floor selector and furniture toggle
- This is what 95% of users see, always

**Advanced Mode:**
- Activated via a settings toggle or keyboard shortcut (e.g., `Ctrl+Shift+D`)
- Reveals: seed value, candidate count, scoring breakdown, constraint violations, Pareto rank, wet-stack indicators, wall segment IDs
- Presented in a dedicated **debug drawer** that overlays the right panel
- Uses monospace type and a slightly tinted background to visually distinguish it from the product experience
- Never contaminates User Mode. No shared UI elements.

The transition between modes is a **conscious, deliberate action** — never accidental.

### 3.5 Panel Behavior

All panels follow these rules:

1. **Panels slide, they do not pop.** Entry animation: 200ms ease-out horizontal slide. No bounce. No fade. No scale.
2. **Panels do not overlay the canvas.** They push the canvas zone inward. The plan re-centers via a smooth viewport adjustment.
3. **Only one right panel is open at a time.** If the AI panel is open and the user opens the parameter panel, the AI panel closes first.
4. **Panels have a visible but subtle close affordance** — a small `×` or a click-outside-to-dismiss behavior.
5. **Panel content is scrollable internally.** The panel frame never grows beyond viewport height.

### 3.6 Drawer Philosophy

Drawers (bottom-rising panels) are reserved for **temporary, confirmatory actions only**:

- Export options
- Share dialogs
- Delete confirmations

They are modal. They dim the background. They are rare. If a drawer appears more than once per session on average, it should be redesigned as a panel or inline interaction.

---

## 4. Visual Design System

### 4.1 Color Palette

**Core Palette:**

| Token | Hex | Usage |
|---|---|---|
| `canvas-white` | `#FAFAF8` | Canvas background — warm, not clinical |
| `paper-white` | `#FFFFFF` | Panels, cards, overlays |
| `wall-exterior` | `#1A1A1A` | Exterior walls — near-black, authoritative |
| `wall-interior` | `#4A4A4A` | Interior partitions — clearly secondary |
| `wall-fill` | `#2C2C2C` | Fill color for wall thickness rendering |
| `label-primary` | `#333333` | Room names |
| `label-secondary` | `#888888` | Dimensions, annotations |
| `accent` | `#2A5FE6` | Selected states, active floor, generate button |
| `accent-hover` | `#1E4ABF` | Button hover state |
| `grid-line` | `#E8E8E4` | Drafting grid |
| `grid-line-major` | `#D4D4D0` | Major grid divisions |
| `door-stroke` | `#555555` | Door frames and swing arcs |
| `furniture-fill` | `#E0DDD8` | Furniture symbol fill |
| `furniture-stroke` | `#AAAAAA` | Furniture symbol outline |
| `success` | `#2E7D52` | Confirmation states |
| `warning` | `#C17B2A` | Soft warnings |
| `error` | `#C0392B` | Validation errors (polygon self-intersection, etc.) |
| `shadow` | `rgba(0,0,0,0.06)` | UI element shadows |

**Strict rules:**
- No gradients anywhere in the product.
- No color fills inside rooms in default view. Rooms are defined by walls, not by color floods.
- Accent color is used sparingly — only for the single most important interactive element on screen at any moment.
- The palette is deliberately **warm neutral**, not cool gray. The product should feel like paper, not like a screen.

### 4.2 Wall Rendering Spec

Walls are the most critical visual element in the product. They must feel **built, not drawn.**

**Exterior Walls:**
- Stroke: `wall-exterior` (#1A1A1A)
- Fill: `wall-fill` (#2C2C2C)
- Rendered as closed polygonal shapes with measurable thickness
- Thickness: 8–10px at default zoom (representing ~200–300mm at architectural scale)
- Corners: mitered, not rounded, not overlapping
- Must feel solid and heavy — the structural boundary of the building

**Interior Walls (Partitions):**
- Stroke: `wall-interior` (#4A4A4A)
- Fill: `wall-interior` at 90% opacity
- Thickness: 4–6px at default zoom (representing ~100–150mm)
- Must feel lighter and thinner than exterior walls — clearly secondary
- T-junctions and L-junctions must be **clean** — no overlapping strokes, no double-rendering artifacts

**Wall Rendering Rules:**
- Walls are **never** rendered as single lines (1px strokes). This is the hallmark of an amateur tool.
- Wall corners must be geometrically resolved — no gaps, no overlaps, no bleed-through.
- When zooming in, wall detail increases. When zooming out, walls simplify but remain visible as filled bands.

### 4.3 Room Rendering Spec

- Rooms are defined by their bounding walls. There is **no fill color** in default User Mode.
- Optional: a `room-tint` mode (toggleable) that adds a barely perceptible wash — `rgba(45, 95, 230, 0.03)` for living spaces, `rgba(45, 160, 80, 0.03)` for bedrooms, etc. This is an enhancement, not a default.
- Room identification is purely through **labels**, not through color coding.

### 4.4 Door Rendering Spec

Doors must look architectural, not diagrammatic.

- **Single door:** A gap in the wall (wall break) + a thin arc showing the swing direction.
  - Arc stroke: `door-stroke`, 1px, dashed at fine intervals.
  - Arc angle: 90° from closed to open position.
  - Door leaf: a thin straight line from the hinge point to the arc's endpoint, stroke 1.5px.
- **Double door:** Two mirrored arcs.
- **Sliding door:** A dashed line parallel to the wall within the wall thickness, with a small arrow indicating slide direction.
- **Door placement data comes entirely from backend.** Frontend only renders — never calculates door positions.
- Door arcs must **not** overlap room labels. If a conflict exists, the label repositions (not the door).

### 4.5 Furniture Rendering Spec

Furniture is **symbolic and architectural** — plan-view representations consistent with drafting convention.

| Element | Representation |
|---|---|
| Bed (single) | Rectangle, 90×190 proportional, with pillow rectangle at head |
| Bed (double) | Rectangle, 140×190 proportional, with two pillow rectangles |
| Sofa | Rectangle with backrest line along one long edge |
| Dining table | Rectangle or circle, depending on backend data |
| Chair | Small square with a line indicating backrest |
| Toilet | Oval within a rectangle (cistern) |
| Sink | Small rectangle with a circle inside |
| Bathtub | Rounded rectangle |
| Shower | Square with a diagonal line or arc indicating door/screen |
| Kitchen counter | L-shape or linear rectangle with sink circle |
| Desk | Rectangle with chair square tucked under one edge |

**Rendering rules:**
- Fill: `furniture-fill` at 50% opacity
- Stroke: `furniture-stroke` at 1px
- All furniture is rendered at **60% opacity** to prevent visual competition with walls
- Furniture never receives hover states or click handlers in User Mode
- Furniture scales proportionally with zoom

### 4.6 Typography Rules

**Font Family:** Inter (primary), system sans-serif (fallback)

| Context | Weight | Size | Transform | Color |
|---|---|---|---|---|
| Room labels (on canvas) | 500 | 11px (scales with zoom) | UPPERCASE | `label-primary` |
| Dimension text (on canvas) | 400 | 9px (scales with zoom) | None | `label-secondary` |
| Panel headings | 600 | 14px | UPPERCASE | `label-primary` |
| Panel body text | 400 | 13px | None | `label-primary` |
| Button text | 500 | 13px | UPPERCASE | White or `accent` |
| Top bar project name | 500 | 14px | None | `label-primary` |
| Floor selector labels | 600 | 12px | UPPERCASE | `label-primary` or White |
| AI analysis prose | 400 | 14px | None | `label-primary`, line-height 1.7 |

**Rules:**
- No font size below 9px anywhere in the product.
- Canvas labels use **letter-spacing: 0.08em** for the uppercase room names — this is critical for the architectural feel.
- No bold weights above 600. The product is calm, not loud.
- No italic anywhere except AI analysis quotes.

### 4.7 Spacing System

All spacing follows a **4px base grid**:

```
4 — micro (icon padding)
8 — tight (between related elements)
12 — compact (form field gaps)
16 — standard (section internal padding)
24 — comfortable (between sections)
32 — spacious (panel padding)
48 — generous (major section breaks)
64 — dramatic (canvas margin from edges)
```

Panels use 32px horizontal padding, 24px vertical padding.

The canvas has a minimum 64px visual margin from any UI element to the nearest plan geometry at fit-to-view zoom.

### 4.8 Shadow System

Shadows are architectural, not material-design.

| Element | Shadow |
|---|---|
| Panels | `0 2px 12px rgba(0,0,0,0.06)` |
| Cards (project gallery) | `0 1px 4px rgba(0,0,0,0.05)` |
| Floating toolbar | `0 1px 8px rgba(0,0,0,0.07)` |
| Drawers | `0 -2px 16px rgba(0,0,0,0.08)` |
| Plan on canvas | None. The plan has no shadow. It sits flat on the drafting board like ink on paper. |

No element ever has a shadow with blur radius above 16px. No element ever has shadow opacity above 0.10. Shadows are **barely there** — felt more than seen.

### 4.9 Grid Philosophy

The canvas grid is a **drafting reference**, not a snap system.

- The grid is cosmetic. It provides spatial orientation and scale awareness.
- Default: **visible but subtle.** Lines at `grid-line` color, 1px, at 1m intervals (at architectural scale).
- Major grid lines every 5m at `grid-line-major`, slightly heavier.
- Grid can be toggled off entirely.
- The grid **does not** imply snapping. Polygon vertices snap to a backend-defined resolution, not to the visible grid.
- Grid lines extend to the full canvas, not just the plan boundary.

---

## 5. Layout Rendering Standards

### 5.1 Wall Thickness Logic

- All wall geometry (centerlines, thickness, endpoints) comes from the backend.
- Frontend renders walls as **filled rectangles or polygons** based on the backend's wall segment data.
- Frontend does **not** calculate wall thickness, intersection resolution, or corner conditions. These are solved geometries.
- If the backend provides wall polygons (closed shapes), render them directly as filled shapes.
- If the backend provides centerlines with thickness metadata, the frontend inflates them symmetrically into renderable shapes — but this is pure rendering math, not architectural logic.

### 5.2 Exterior vs Interior Wall Distinction

- The backend tags each wall segment as `exterior` or `interior`.
- Frontend applies different styles based on this tag (see §4.2).
- There must be a clear visual hierarchy: exterior walls are dominant, interior walls are subordinate.
- At extreme zoom-out levels, interior walls may thin to 2px but exterior walls never thin below 4px.

### 5.3 Label Placement Rules

- Each room receives exactly one label, centered within its largest inscribed rectangle or at the centroid provided by the backend.
- Labels are **always horizontal.** Never rotated, never angled, never curved along walls.
- Labels must not overlap walls. If a room is too small to contain its label at the current zoom level, the label hides and a small indicator dot appears instead. On hover or zoom-in, the label becomes visible.
- Dimension labels (if enabled) sit along wall edges, offset 6–8px from the wall face, with thin extension lines connecting them to the wall endpoints.
- Label rendering order: room names first, dimensions second. Dimensions hide before room names do when space is constrained.

### 5.4 Door Arc Rules

- Door positions and swing directions come from backend.
- The frontend renders:
  1. A **wall break** (gap in the wall segment) at the door location.
  2. A **door leaf** (straight line from hinge to door edge).
  3. A **swing arc** (90° arc from closed to open position).
- Arcs are always rendered as thin, dashed curves — never solid, never thick.
- Door arcs render on top of the room space but below furniture and labels.
- If two doors' arcs would overlap, both still render — this is architecturally correct and visually expected.

### 5.5 Scale Handling

- The backend provides all geometry in real-world units (millimeters or meters).
- The frontend maintains a **scale factor** that maps real-world units to screen pixels.
- A **scale bar** in the bottom bar shows the current scale (e.g., a line labeled "1m" or "5m") — never a ratio like "1:100."
- The scale bar dynamically updates with zoom.
- All rendering decisions (wall thickness in pixels, label size, furniture size) are functions of this scale factor. Nothing is hard-coded to a pixel value independent of scale.

### 5.6 Floor Transitions

- Each floor is a **complete, independent rendering.** There is no blending, morphing, or overlay between floors.
- When the user switches floors:
  1. Current floor fades out (100ms, opacity 1→0).
  2. New floor fades in (150ms, opacity 0→1).
  3. Viewport position and zoom level **persist** across floor switches. The user's spatial orientation is maintained.
- The exterior boundary (plot polygon) remains visible and identical across all floors, reinforcing spatial continuity.

### 5.7 Deterministic Rendering Rules

**This is non-negotiable:**

- Given the same backend response, the frontend must produce a **pixel-identical** rendering every time.
- No random jitter, no animated entry positions, no stochastic label placement.
- All positions are computed from backend data + viewport state. Nothing is random.
- If any visual element uses a random number generator (even for decorative purposes), it is a bug. Remove it.
- Canvas background is a flat color, not a procedural texture.
- Any future decorative elements (paper texture, noise, grain) must use a **deterministic, static asset** — never a procedurally generated one.

---

## 6. Multi-Floor UX Model

### 6.1 Floor Selector Behavior

- **Location:** Left rail, vertically stacked pills.
- **Ordering:** Ground floor at bottom, ascending upward. This mirrors physical reality.
- **Visual treatment:**
  - Active floor: filled pill with `accent` color, white text.
  - Inactive floors: outlined pill with `label-secondary` text.
  - Hover: light accent tint background.
- **Interaction:** Single click to switch. No drag, no long-press, no gestures.
- **Visibility:** Only appears when the generated plan has more than one floor.

### 6.2 Visual Indication of Active Floor

- The floor selector's active state is the primary indicator.
- A secondary indicator exists as a **floor label** in the bottom-left of the canvas: "GROUND FLOOR" / "FIRST FLOOR" — in `label-secondary` color, uppercase, small, and non-intrusive.
- The canvas does not change background color between floors. The plan geometry alone communicates the difference.

### 6.3 Vertical Relationship Hints

- When viewing any floor, **staircase locations** are rendered with a standard architectural stair symbol (parallel lines with an arrow indicating ascent direction).
- A subtle **"ghost outline"** option (toggleable, off by default) shows the floor below at 8% opacity — allowing the user to see vertical alignment without full overlay. This is particularly useful for validating wet-stack alignment.
- Ghost outlines are rendered on Layer 1.5 (between plot and exterior walls) and never interfere with the active floor's readability.

### 6.4 Stair Visualization Strategy

- Stairs are rendered as:
  - A rectangular boundary matching the stair footprint.
  - Internal parallel lines representing treads.
  - A directional arrow indicating "UP" from the current floor's perspective.
  - A dashed line across the midpoint if the stair has a landing/turn.
- Stair label: "UP" or "DN" in small caps next to the arrow.
- Stairs use a slightly different stroke color — `#666666` — to distinguish them from walls while remaining architectural.

---

## 7. Studio Modes

### 7.1 Draft Mode (Draw Polygon)

**Purpose:** The user defines the plot boundary.

**Characteristics:**
- Canvas shows only the grid and the polygon being drawn.
- Cursor changes to a crosshair (`+`).
- Each click places a vertex, visualized as a small circle (4px radius, `accent` color).
- Edges between vertices render as thin lines (`accent` color, 1.5px).
- The closing edge (from last vertex back to first) renders as a dashed line until the polygon is closed.
- Right-click or Escape removes the last placed vertex (undo).
- Upon closing, the polygon fills with a barely perceptible tint (`accent` at 3% opacity) and the edges become solid.
- A "Clear" option appears to restart.
- The right panel slides in with the parameter form.

**Available controls:** Draw, Undo vertex, Clear, Pan, Zoom.

**Transition to Plan Mode:** User clicks "Generate Plan."

### 7.2 Plan Mode (View Layout)

**Purpose:** The user views, navigates, and analyzes the generated plan.

**Characteristics:**
- The canvas shows the fully rendered floor plan.
- The polygon is now the exterior wall — no longer a separate visual element.
- All rendering layers are active.
- Floor selector appears (if multi-floor).
- Furniture toggle is available.
- AI analysis tab is available.
- The parameter panel is dismissible but re-accessible via a small icon in the top bar.

**Available controls:** Pan, Zoom, Floor switch, Furniture toggle, AI panel, Regenerate, Export.

**Transition back to Draft Mode:** User clicks "Edit Plot" (which clears the plan and returns to the polygon editor with the existing polygon intact).

### 7.3 Edit Mode (Future — Optional)

**Purpose:** Allow post-generation adjustments.

**Characteristics (when implemented):**
- Room boundaries become selectable.
- Walls can be dragged to resize rooms (within constraints).
- Doors can be repositioned along walls.
- Changes are sent to the backend for constraint validation.
- The backend returns an adjusted plan or a rejection with explanation.

**This mode is a future milestone. The frontend architecture should accommodate it but must not build toward it prematurely.** The component structure should allow room-level interactivity to be layered on without refactoring the rendering pipeline.

### 7.4 Advanced Mode (Developer/Debug)

**Purpose:** Expose engine internals for power users, QA, and development.

**Characteristics:**
- Toggled via `Ctrl+Shift+D` or a hidden settings option.
- A top-bar badge reads "ADVANCED" in a muted color to indicate the mode is active.
- The right panel gains an additional tab: "Engine."
- The Engine tab shows:
  - Deterministic seed value
  - Number of candidates generated
  - Selected candidate's Pareto rank
  - Scoring breakdown (by category)
  - Constraint satisfaction report
  - Wet-stack alignment indicators
  - Wall segment IDs (on-canvas, toggled)
  - Room adjacency graph (simple node diagram)
- All Advanced Mode data is rendered with `monospace` font, slightly tinted background (`#F5F3EE`), and clear visual separation from User Mode elements.
- Advanced Mode persists across sessions (stored in local storage) until explicitly turned off.
- Advanced Mode never affects the canvas rendering of the plan itself — debug info overlays are always on a separate, dismissible layer.

### 7.5 Mode Transitions

```
┌──────────┐     Generate      ┌──────────┐
│  DRAFT   │ ───────────────→  │   PLAN   │
│  MODE    │                   │   MODE   │
│          │ ←───────────────  │          │
└──────────┘    Edit Plot      └──────────┘
                                    │
                               Ctrl+Shift+D
                                    │
                                    ▼
                              ┌──────────┐
                              │ ADVANCED │
                              │  (overlay)│
                              └──────────┘
```

Mode transitions are instant. No route changes. No page reloads. The canvas persists. Only the available tools and visible panels change.

---

## 8. What Must Be Removed From the Current UI

The following elements are **currently visible** and must be **removed or relocated to Advanced Mode only**:

| Element | Current State | Required State | Reason |
|---|---|---|---|
| Seed value display | Visible on main UI | Advanced Mode only | Exposes engine internals; meaningless to users |
| Candidate count | Visible on main UI | Advanced Mode only | Implementation detail with no user value |
| Scoring metrics (raw) | Visible on main UI | Advanced Mode only or hidden entirely | Numbers without context erode trust rather than build it |
| Pareto rank indicator | Visible on main UI | Advanced Mode only | Technical jargon |
| Constraint violation list | Visible on main UI | Advanced Mode only | Debug artifact |
| JSON response viewer | Visible on main UI | Advanced Mode only or removed | Developer tool, not a product feature |
| Debug grid overlays | Active by default | Off by default, toggleable in Advanced Mode | Pollutes the architectural rendering |
| Wall segment IDs | Visible on canvas | Advanced Mode toggle only | Meaningless to any non-developer |
| Engine timing metrics | Visible | Removed from all modes (log to console only) | Never relevant to product experience |
| Raw API response panel | Visible | Advanced Mode only | Full exposure of backend implementation |
| Dark/black background panels | Present | Replaced with light theme | Contradicts architectural studio aesthetic |
| Dense metric dashboards | Present | Removed or restructured as prose AI analysis | Dashboard aesthetics destroy spatial focus |

**The guiding rule:** If a user would need to read documentation to understand what a UI element means, it does not belong in User Mode.

---

## 9. Future Expansion Compatibility

The frontend architecture must accommodate the following future directions without requiring a rewrite of the core canvas or state management systems.

### 9.1 VR / 3D Mode

- The current Konva-based 2D canvas will coexist with a future Three.js or WebGL 3D view.
- The state management layer (Zustand) must store plan data in a **view-agnostic format** — geometry data that can be consumed by either a 2D or 3D renderer.
- The mode switcher in the top bar should be designed to accommodate a "3D" toggle in the future, next to "2D" — even if the 3D option is not yet built.
- The component architecture must separate **data transformation** from **rendering.** The same room data should flow to either a Konva `<Rect>` or a Three.js `<Mesh>` without intermediate transformation.

### 9.2 Export Mode

- The export flow will eventually support: PDF, DXF, PNG, SVG.
- The bottom bar or top bar should have a reserved position for an "Export" action that opens a drawer with format options.
- The Konva stage must be renderable to a static image at arbitrary resolution (for high-DPI PDF generation).
- Export is a **presentation of the same deterministic state** — the export must match the canvas exactly.

### 9.3 Material Themes

- Future feature: allow users to select material palettes (e.g., "Scandinavian," "Industrial," "Tropical") that tint the plan rendering.
- The rendering pipeline must support **theme tokens** that can override the default color palette at the room/wall/furniture level.
- Theme application is a visual skin, not a structural change. The geometry and layout remain identical.

### 9.4 Realistic Rendering

- Future feature: apply photorealistic textures, lighting, and shadows to the 2D plan for presentation purposes.
- This requires the rendering layer to support **texture mapping** on room polygons and furniture shapes.
- The architectural line-drawing mode will always remain the default and primary mode. Realistic rendering is an optional view mode, never a replacement.

### 9.5 Architecture Principles for Future-Proofing

1. **All rendering reads from a normalized state store.** Renderers are consumers, never producers, of spatial data.
2. **The canvas component is replaceable.** If Konva is swapped for a different renderer, only the rendering layer changes. State, panels, controls, and data flow remain intact.
3. **Feature flags govern mode availability.** VR, export, themes, and realistic rendering are feature-flagged. The UI adapts its controls based on which flags are active.
4. **No spatial data is derived from pixel coordinates.** All room areas, wall lengths, and dimensions are sourced from backend metadata, never from measuring rendered shapes on screen.

---

## 10. Anti-Patterns

### 10.1 What NOT to Do

**Do not expose numbers without narrative.**
A score of "0.83" means nothing. A sentence saying "This layout optimizes circulation between the kitchen and dining area" means everything. Numbers belong in Advanced Mode. Narrative belongs in User Mode.

**Do not use dark backgrounds.**
Dark UIs signal "developer tool" or "gaming." Architectural tools live in daylight. The canvas is paper. Paper is light.

**Do not render walls as single-pixel lines.**
This is the single most damaging visual shortcut. It transforms an architectural plan into a wireframe diagram. Walls have thickness. They must be rendered with thickness. Always.

**Do not animate plan generation progressively.**
Drawing rooms one by one, or walls growing outward, or doors popping in — these animations feel playful and undermine the authority of the output. The plan arrives complete, as if it was always the answer.

**Do not use color-coded rooms as the primary differentiation.**
Floor plans are not heat maps. Rooms are defined by walls, labels, and spatial proportion — not by fill color. Color coding, if used at all, is a faint optional overlay.

**Do not crowd the canvas with controls.**
Every button on the canvas is a distraction from the plan. Controls should be at the periphery — in rails, bars, and panels. The canvas is sacred space.

**Do not show loading skeletons of UI components.**
Skeleton screens are appropriate for content feeds. They are inappropriate for a drafting board. During generation, show a minimal, calm loading state — or show nothing and let the plan appear when ready.

**Do not use tooltips as a crutch for bad labeling.**
If an icon needs a tooltip to be understood, the icon is wrong or the feature is in the wrong place. Every visible control must be self-evident.

**Do not mix architectural rendering with UI component rendering on the same visual layer.**
Buttons, dropdowns, and form elements must never appear inside the Konva canvas. They exist in the HTML/DOM layer above or beside the canvas. The canvas contains only architectural content.

### 10.2 What Makes a Tool Feel Like a Developer Dashboard

- Monospace fonts in the primary UI
- Visible state management (showing store keys, update timestamps)
- Tabular data as the primary information format
- Accordions containing technical parameters
- Toggling features via labeled checkboxes ("Enable wet-stack validation," "Show Pareto front")
- Console-style logs visible in the UI
- Hash values, UUIDs, or internal IDs anywhere in User Mode
- Multiple numerical scores without context
- Settings panels with more than 8 options visible at once
- URL query parameters that expose internal state (`?seed=42&candidates=50`)

### 10.3 What Breaks Premium Perception

- **Visual inconsistency:** Two buttons that do similar things but look different.
- **Misaligned elements:** A label that's 1px off from its associated field.
- **Harsh transitions:** A panel that snaps open instead of sliding.
- **Orphaned states:** A loading spinner that stays after content has loaded.
- **Dead clicks:** Areas that look interactive but aren't.
- **Layout shift:** Elements that jump when content loads or panels open.
- **Overloaded initial state:** A first-visit experience that shows 15 controls before the user has done anything.
- **Default browser styling:** Unstyled scrollbars, default focus rings, system font fallbacks.
- **Inconsistent capitalization:** "Generate plan" vs "Generate Plan" vs "GENERATE PLAN" across different buttons.

---

## Appendix: The Canvas Mandate

The canvas is the product. Everything else is in service of the canvas.

If a design decision improves the canvas experience, it is correct. If a design decision adds UI complexity that doesn't directly enhance what happens on the canvas, it is wrong.

The user opens the product to see a floor plan. The floor plan must be beautiful, legible, precise, and calm. Everything else — every panel, every button, every mode, every label — exists only to make that moment better.

This document is the contract between the product's ambition and its implementation. Every frontend commit should be measured against it.

---

*End of document.*