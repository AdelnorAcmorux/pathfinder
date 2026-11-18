import {
  ENOUGH_IN_RANGE,
  MAX_BISECTION_TRIES,
  MAX_ROUTE_CALLS,
  MAX_SELF_OVERLAP,
  MAX_SHAPES,
  RANDOM_SEED,
  SEARCH_BATCH_SIZE,
  type Shape,
} from "./config.js";
import { selfOverlapRatio } from "./filter.js";
import { bearingDeg, destination, haversineM } from "./geometry.js";
import { buildShapes, randomShapes } from "./shapes.js";
import type { LngLat, RouteResult, RoutingEngine } from "./types.js";

export interface CandidatePool {
  direct: RouteResult;
  pool: RouteResult[]; // every route GraphHopper returned while searching, any length
}

/**
 * For each shape, place its waypoints along the A-B line, pushed sideways by an offset d,
 * and bisect d until the route lands in [baseMinM, baseMaxM]. Shapes are tried in batches
 * until there are enough clean in-range routes or the call budget runs out.
 */
export async function collectCandidates(
  engine: RoutingEngine,
  a: LngLat,
  b: LngLat,
  targetM: number,
  baseMinM: number,
  baseMaxM: number,
  customModel?: object,
): Promise<CandidatePool> {
  const direct = await engine.route([a, b], customModel); // failure here = real error, let it throw
  let calls = 1;

  const straightM = haversineM(a, b);
  const circuity = Math.max(1, direct.distanceM / Math.max(1, straightM));
  const abBearing = bearingDeg(a, b);

  const waypoints = (shape: Shape, d: number): LngLat[] =>
    shape.map(([along, side, scale = 1]) => {
      const onLine = destination(a, abBearing, along * straightM);
      return destination(onLine, (abBearing + 90 * side + 360) % 360, d * scale);
    });

  // Free first guess (no GraphHopper call): d where circuity * straight-line length
  // of A -> waypoints -> B equals the target.
  const guessOffset = (shape: Shape): number => {
    const estimate = (d: number) => {
      const pts = [a, ...waypoints(shape, d), b];
      let sum = 0;
      for (let i = 1; i < pts.length; i++) sum += haversineM(pts[i - 1]!, pts[i]!);
      return sum * circuity;
    };
    let lo = 0;
    let hi = targetM;
    for (let i = 0; i < 25; i++) {
      const mid = (lo + hi) / 2;
      if (estimate(mid) < targetM) lo = mid;
      else hi = mid;
    }
    return Math.max(100, (lo + hi) / 2);
  };

  const searchShape = async (shape: Shape): Promise<RouteResult[]> => {
    const tried: RouteResult[] = [];
    let lo = 0;
    let hi = targetM;
    let hiIsReal = false;
    let d = guessOffset(shape);
    for (let i = 0; i < MAX_BISECTION_TRIES; i++) {
      if (calls >= MAX_ROUTE_CALLS) break;
      calls++;
      let r: RouteResult;
      try {
        r = await engine.route([a, ...waypoints(shape, d), b], customModel);
      } catch {
        // a waypoint is unreachable (water, no road nearby): move closer and retry
        hi = d;
        hiIsReal = true;
        d = (lo + d) / 2;
        continue;
      }
      tried.push(r);
      if (r.distanceM >= baseMinM && r.distanceM <= baseMaxM) break;
      if (r.distanceM < baseMinM) {
        lo = d;
        d = hiIsReal ? (d + hi) / 2 : d * 1.5;
      } else {
        hi = d;
        hiIsReal = true;
        d = (lo + d) / 2;
      }
    }
    return tried;
  };

  const fixed = buildShapes(straightM);
  const shapes = [...fixed, ...randomShapes(straightM, Math.max(0, MAX_SHAPES - fixed.length), RANDOM_SEED)];

  const pool: RouteResult[] = [];
  const goodCount = () =>
    pool.filter(
      (r) => r.distanceM >= baseMinM && r.distanceM <= baseMaxM && selfOverlapRatio(r) <= MAX_SELF_OVERLAP,
    ).length;

  for (let i = 0; i < shapes.length; i += SEARCH_BATCH_SIZE) {
    const batch = shapes.slice(i, i + SEARCH_BATCH_SIZE);
    const results = await Promise.all(batch.map(searchShape));
    pool.push(...results.flat());
    if (goodCount() >= ENOUGH_IN_RANGE || calls >= MAX_ROUTE_CALLS) break;
  }
  return { direct, pool };
}