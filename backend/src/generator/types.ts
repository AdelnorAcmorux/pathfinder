import type { LngLat, RouteResult } from "../engine/graphhopper.js";

export type { LngLat, RouteResult };

// Anything with the same route() signature works, so tests can pass a fake engine.
export interface RoutingEngine {
  route(points: LngLat[], customModel?: object): Promise<RouteResult>;
}

// Notices are message KEYS + data only. The UI translates them (en / fr-CA).
export type GeneratorNotice =
  | { code: "RANGE_WIDENED"; extraMeters: number } // per side
  | { code: "TARGET_SHORTER_THAN_DIRECT"; directM: number }
  | { code: "NO_ROUTES_FOUND" };

export interface GeneratorResult {
  routes: RouteResult[]; // closest to the target length first
  notices: GeneratorNotice[];
}