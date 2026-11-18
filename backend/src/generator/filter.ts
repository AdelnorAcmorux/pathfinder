import { haversineM } from "./geometry.js";
import type { RouteResult } from "./types.js";

export function filterByRange(routes: RouteResult[], minM: number, maxM: number): RouteResult[] {
  return routes.filter((r) => r.distanceM >= minM && r.distanceM <= maxM);
}

// Closest to the target first. Exact ties keep their relative order (Array.sort is stable).
export function sortByClosest(routes: RouteResult[], targetM: number): RouteResult[] {
  return [...routes].sort(
    (a, b) => Math.abs(a.distanceM - targetM) - Math.abs(b.distanceM - targetM),
  );
}

// Share of a's path (snapped to a ~10 m grid) that b also covers.
function overlap(a: RouteResult, b: RouteResult): number {
  const key = (c: number[]) => `${c[0]!.toFixed(4)},${c[1]!.toFixed(4)}`;
  const setB = new Set(b.coordinates.map(key));
  const cellsA = new Set(a.coordinates.map(key));
  let shared = 0;
  for (const k of cellsA) if (setB.has(k)) shared++;
  return shared / Math.max(1, Math.min(cellsA.size, setB.size));
}

// Expects routes already sorted best-first; keeps the best of each near-duplicate group.
export function dropNearDuplicates(routes: RouteResult[], maxOverlap: number): RouteResult[] {
  const kept: RouteResult[] = [];
  for (const r of routes) {
    if (!kept.some((k) => overlap(r, k) > maxOverlap)) kept.push(r);
  }
  return kept;
}

// Share of the route's length that retraces a street segment it already used
// (either direction). High values mean out-and-back spurs.
export function selfOverlapRatio(r: RouteResult): number {
  const cell = (c: number[]) => `${c[0]!.toFixed(4)},${c[1]!.toFixed(4)}`;
  const seen = new Set<string>();
  let repeatedM = 0;
  let totalM = 0;
  for (let i = 1; i < r.coordinates.length; i++) {
    const p = r.coordinates[i - 1]!;
    const q = r.coordinates[i]!;
    const k1 = cell(p);
    const k2 = cell(q);
    if (k1 === k2) continue;
    const segM = haversineM([p[0]!, p[1]!], [q[0]!, q[1]!]);
    totalM += segM;
    const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    if (seen.has(key)) repeatedM += segM;
    else seen.add(key);
  }
  return totalM === 0 ? 0 : repeatedM / totalM;
}