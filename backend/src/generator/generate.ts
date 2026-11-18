import { collectCandidates } from "./candidate.js";
import {
  LENGTH_TOLERANCE,
  MAX_OVERLAP,
  MAX_ROUTES_RETURNED,
  MAX_SELF_OVERLAP,
  MAX_WIDEN_STEPS,
  WIDEN_STEP_M,
} from "./config.js";
import { dropNearDuplicates, filterByRange, selfOverlapRatio, sortByClosest } from "./filter.js";
import type { GeneratorNotice, GeneratorResult, LngLat, RoutingEngine } from "./types.js";

export async function generateAToB(
  engine: RoutingEngine,
  a: LngLat,
  b: LngLat,
  targetM: number,
  customModel?: object,
): Promise<GeneratorResult> {
  const baseTol = targetM * LENGTH_TOLERANCE;
  const { direct, pool } = await collectCandidates(
    engine, a, b, targetM, targetM - baseTol, targetM + baseTol, customModel,
  );
  // Reject routes that run out and back along the same street.
  const all = [direct, ...pool].filter((r) => selfOverlapRatio(r) <= MAX_SELF_OVERLAP);
console.log("pool:", all.length,
  "| in ±10%:", filterByRange(all, targetM - baseTol, targetM + baseTol).length,
  "| lengths:", all.map(r => Math.round(r.distanceM)).sort((a, b) => a - b));
  // Widening is just a re-filter of the pool: no extra GraphHopper calls.
  for (let step = 0; step <= MAX_WIDEN_STEPS; step++) {
    const extraM = step * WIDEN_STEP_M; // applies to both sides
    const tol = baseTol + extraM;
    const inRange = filterByRange(all, targetM - tol, targetM + tol);
    if (inRange.length === 0) continue;

    const routes = dropNearDuplicates(sortByClosest(inRange, targetM), MAX_OVERLAP).slice(
      0, MAX_ROUTES_RETURNED,
    );
    const notices: GeneratorNotice[] = extraM > 0 ? [{ code: "RANGE_WIDENED", extraMeters: extraM }] : [];
    return { routes, notices };
  }

  return {
    routes: [],
    notices: [
      direct.distanceM > targetM
        ? { code: "TARGET_SHORTER_THAN_DIRECT", directM: direct.distanceM }
        : { code: "NO_ROUTES_FOUND" },
    ],
  };
}