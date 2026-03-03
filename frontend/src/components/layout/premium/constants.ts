/**
 * Design system for premium layout canvas.
 * No magic numbers in layer components.
 */

export const WALL = {
  LINE_JOIN: "miter" as const,
  SHADOW_COLOR: "black",
  SHADOW_BLUR: 6,
  SHADOW_OPACITY: 0.08,
  SHADOW_OFFSET_X: 2,
  SHADOW_OFFSET_Y: 2,
} as const;

export const WALL_EXTERIOR = {
  STROKE: "#111827",
  STROKE_WIDTH: 10,
} as const;

export const WALL_INTERIOR = {
  STROKE: "#1F2937",
  STROKE_WIDTH: 7,
} as const;

export const ROOM_FILL = {
  DEFAULT: "#FAFAF8",
  LIVING: "#F8FAFC",
  BEDROOM: "#FDF2F8",
  KITCHEN: "#F3F4F6",
  BATHROOM: "#F1F5F9",
  DINING: "#FFFBEB",
} as const;

export const FURNITURE = {
  LIVING: "#94A3B8",
  BEDROOM: "#E5E7EB",
  KITCHEN: "#D1D5DB",
  BATHROOM: "#CBD5E1",
  DEFAULT: "#E5E7EB",
} as const;

export const DOOR = {
  STROKE: "#1F2937",
  STROKE_WIDTH: 2,
  ARC_STROKE: "#374151",
  GAP_RATIO: 0.9,
} as const;

export const PLOT = {
  STROKE: "#9CA3AF",
  STROKE_WIDTH: 2,
} as const;

export const LABEL = {
  FILL: "#1F2937",
  FONT_SIZE: 13,
  FONT_STYLE: "bold",
  LETTER_SPACING: 1.4,
  OPACITY: 0.75,
  MIN_AREA_M2: 6,
} as const;

export const WORKSPACE = {
  BG: "bg-gray-100",
  BOARD_BG: "white",
  BOARD_RADIUS: "rounded-2xl",
  BOARD_SHADOW: "shadow-xl",
  TOP_BAR_SHADOW: "shadow-sm",
  CONTROL_SHADOW: "shadow-md",
  CONTROL_RADIUS: "rounded-full",
} as const;
