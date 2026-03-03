export type Point = [number, number];
export type Polygon = Point[];

export function polygonBounds(poly: Polygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

export function polygonCentroid(poly: Polygon): Point {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  const n = poly.length;
  if (n === 0) return [0, 0];
  for (let i = 0; i < n; i += 1) {
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
    for (const [x, y] of poly) {
      sx += x;
      sy += y;
    }
    return [sx / n, sy / n];
  }
  const area = twiceArea * 0.5;
  return [cx / (6 * area), cy / (6 * area)];
}

export function minDimensionBoundingBox(poly: Polygon): number {
  const { minX, minY, maxX, maxY } = polygonBounds(poly);
  const w = maxX - minX;
  const h = maxY - minY;
  return Math.min(w, h);
}

export function pointInPolygon(point: Point, poly: Polygon): boolean {
  const [px, py] = point;
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonInsidePolygon(inner: Polygon, outer: Polygon): boolean {
  if (inner.length === 0) return false;
  for (const p of inner) {
    if (!pointInPolygon(p, outer)) return false;
  }
  return true;
}

function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
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

export function polygonsOverlap(a: Polygon, b: Polygon): boolean {
  if (a.length === 0 || b.length === 0) return false;

  // quick bbox reject
  const ba = polygonBounds(a);
  const bb = polygonBounds(b);
  if (ba.maxX < bb.minX || bb.maxX < ba.minX || ba.maxY < bb.minY || bb.maxY < ba.minY) {
    return false;
  }

  // any vertex inside the other
  if (a.some((p) => pointInPolygon(p, b)) || b.some((p) => pointInPolygon(p, a))) {
    return true;
  }

  // edge intersection
  for (let i = 0; i < a.length; i += 1) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j += 1) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }

  return false;
}

