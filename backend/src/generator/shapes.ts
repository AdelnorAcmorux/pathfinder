import type { Shape } from "./config.js";

// Distance between consecutive waypoints along the A-B line. Smaller = tighter weaving.
const SPACINGS_M = [250, 400, 600, 900];
const MAX_WAYPOINTS = 12;

/**
 * Candidate shapes for an A-B pair of the given straight-line length:
 * - two single bumps (fallback for sparse areas, makes one big detour)
 * - meanders: n waypoints alternating left/right along the line, so GraphHopper
 *   links many short hops through the street grid instead of one big loop.
 */
export function buildShapes(straightM: number): Shape[] {
  const shapes: Shape[] = [[[0.5, 1]], [[0.5, -1]]];
  const seen = new Set<number>();
  for (const spacing of SPACINGS_M) {
    const n = Math.min(MAX_WAYPOINTS, Math.max(2, Math.round(straightM / spacing)));
    if (seen.has(n)) continue;
    seen.add(n);
    for (const first of [1, -1] as const) {
      const shape: Shape = [];
      for (let k = 0; k < n; k++) {
        shape.push([(k + 0.5) / n, k % 2 === 0 ? first : (-first as 1 | -1)]);
      }
      shapes.push(shape);
    }
  }
  return shapes;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded random meanders: random count, jittered positions, mostly alternating sides, varied amplitude. */
export function randomShapes(straightM: number, count: number, seed: number): Shape[] {
  const rng = mulberry32(seed);
  const maxN = Math.min(MAX_WAYPOINTS, Math.max(2, Math.round(straightM / 250)));
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const n = 2 + Math.floor(rng() * (maxN - 1));
    const shape: Shape = [];
    let side: 1 | -1 = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < n; k++) {
      if (k > 0) side = rng() < 0.8 ? ((-side) as 1 | -1) : side;
      const along = Math.min(0.97, Math.max(0.03, (k + 0.5) / n + ((rng() - 0.5) * 0.6) / n));
      shape.push([along, side, 0.6 + rng() * 0.8]);
    }
    shapes.push(shape);
  }
  return shapes;
}