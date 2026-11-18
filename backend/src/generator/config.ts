// Tunable values. LENGTH_TOLERANCE becomes a per-user setting later.
export const LENGTH_TOLERANCE = 0.1; // +-10% of the requested length
export const WIDEN_STEP_M = 250; // added to EACH side per widening step
export const MAX_WIDEN_STEPS = 8; // hard cap: never loop forever (2 km per side)

// Candidate search
// A shape is a list of waypoints: [fraction along A->B, side (+1 left / -1 right)].
// The sideways offset (same for all waypoints of a shape) is what gets bisected.
// Optional third value scales this waypoint's offset (default 1).
// Shapes are generated in shapes.ts.
export type Shape = [along: number, side: 1 | -1, scale?: number][];
export const MAX_BISECTION_TRIES = 5; // GraphHopper calls per shape
export const MAX_ROUTES_RETURNED = 10;
export const MAX_OVERLAP = 0.8; // two routes sharing >80% of their path are duplicates
export const MAX_SELF_OVERLAP = 0.03; // a route retracing >3% of its own length is rejected

// Search budget
export const SEARCH_BATCH_SIZE = 8; // shapes tried in parallel
export const MAX_SHAPES = 60;
export const MAX_ROUTE_CALLS = 120; // hard cap on GraphHopper calls per search
export const ENOUGH_IN_RANGE = 15; // stop early once this many clean in-range routes exist
export const RANDOM_SEED = 1; // fixed so results are reproducible