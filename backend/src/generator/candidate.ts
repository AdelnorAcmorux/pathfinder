import { MAX_BISECTION_TRIES, WAYPOINT_ANGLES_DEG } from "./config.js";
import { bearingDeg, destination, haversineM, midpoint } from "./geometry.js";
import type { LngLat, RouteResult, RoutingEngine } from "./types.js";

export interface CandidatePool {
  direct: RouteResult;
  pool: RouteResult[]; // every route GraphHopper returned while searching, any length
}

/**
 * For each angle, place a waypoint W at distance d from the A-B midpoint and bisect d
 * until route A -> W -> B lands in [baseMinM, baseMaxM]. Every attempt goes in the pool.
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

  const straightM = haversineM(a, b);
  const circuity = Math.max(1, direct.distanceM / Math.max(1, straightM));
  const mid = midpoint(a, b);
  const abBearing = bearingDeg(a, b);

  // First guess for d, treating W as a perpendicular offset: c * 2*sqrt((S/2)^2 + d^2) = target
  const half = targetM / (2 * circuity);
  const d0 = Math.max(200, Math.sqrt(Math.max(0, half ** 2 - (straightM / 2) ** 2)));

  const searchAngle = async (angle: number): Promise<RouteResult[]> => {
    const tried: RouteResult[] = [];
    let lo = 0;
    let hi = targetM; // W can never usefully be further than the target from the midpoint
    let d = d0;
    for (let i = 0; i < MAX_BISECTION_TRIES; i++) {
      const w = destination(mid, (abBearing + angle + 360) % 360, d);
      let r: RouteResult;
      try {
        r = await engine.route([a, w, b], customModel);
      } catch {
        // W is unreachable (water, no road nearby): move closer and retry
        hi = d;
        d = (lo + d) / 2;
        continue;
      }
      tried.push(r);
      if (r.distanceM >= baseMinM && r.distanceM <= baseMaxM) break;
      if (r.distanceM < baseMinM) {
        lo = d;
        d = hi === targetM ? d * 1.5 : (d + hi) / 2;
      } else {
        hi = d;
        d = (lo + d) / 2;
      }
    }
    return tried;
  };

  const results = await Promise.all(WAYPOINT_ANGLES_DEG.map(searchAngle));
  return { direct, pool: results.flat() };
}