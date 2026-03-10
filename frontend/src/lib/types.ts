export type GateDirection = "north" | "south" | "east" | "west";

export type RoomCategory = "public" | "private" | "service";

export type RoomSpec = {
  name: string;
  target_area: number;
  category: RoomCategory;
};

export type PlotIn = {
  vertices: [number, number][];
  gate_direction: GateDirection | string;
  road_adjacency?: string[];
};

export type StructuredQuestionOut = {
  id: string;
  text: string;
  type: string;
  options: string[];
  default: string | null;
  category: string;
  why_it_matters: string;
  constraint_impact: string[];
  priority: number;
};

export type GenerateLayoutsRequest = {
  plot: PlotIn;
  rooms: RoomSpec[];
  setback_m?: number;
  num_candidates?: number;
  generation_seed?: number;
  num_floors?: number;
  user_answers?: Record<string, string | number | boolean> | null;
  last_score_breakdown?: Record<string, number> | null;
};

export type ImproveLayoutRequest = {
  layout: LayoutCandidate;
  iterations?: number;
  mutation_strength?: number;
  generation_seed?: number;
  gate_direction?: string;
};

export type ImproveLayoutResponse = {
  improved_layout: LayoutCandidate;
  original_score: ScoreBreakdown;
  improved_score: ScoreBreakdown;
  score_delta: number;
};


export type BBox = {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
};

export type ScoreBreakdown = {
  total: number;
  dimension_scores?: Record<string, number>;
  pareto_rank?: number | null;
  space_utilization: number;
  natural_light: number;
  privacy: number;
};

export type RoomPlacement = {
  name: string;
  category: RoomCategory | string;
  target_area: number;
  area_m2: number;
  centroid: [number, number];
  polygon: [number, number][];
};

export type DoorModel = {
  id: string;
  room_a: string;
  room_b: string | null;
  position: [number, number];
  angle: number;
  width: number;
  floor_number?: number;
};

export type LayoutCandidate = {
  candidate_id: number;
  rooms: RoomPlacement[];
  adjacency: [string, string][];
  adjacency_matrix: Record<string, string[]>;
  circulation_paths: [number, number][][];
  doors?: DoorModel[];
  bbox: BBox;
  scores: ScoreBreakdown;
};

export type GenerateLayoutsResponse = {
  plot_area_m2: number;
  plot_bbox: BBox;
  buildable_area_m2: number;
  buildable_bbox: BBox;
  buildable_polygon: [number, number][];
  candidates: LayoutCandidate[];
  pending_questions?: StructuredQuestionOut[];
};

export type AnalyzeLayoutResponse = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  architectural_notes: string[];
};

export type ExplainImprovementResponse = {
  summary: string;
  key_changes: string[];
  why_score_improved: string[];
  tradeoffs: string[];
  rooms_most_affected: string[];
};

