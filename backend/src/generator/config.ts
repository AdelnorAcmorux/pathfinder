// Tunable values. LENGTH_TOLERANCE becomes a per-user setting later.
export const LENGTH_TOLERANCE = 0.1; // +-10% of the requested length
export const WIDEN_STEP_M = 250; // added to EACH side per widening step
export const MAX_WIDEN_STEPS = 8; // hard cap: never loop forever (2 km per side)

// Candidate search
export const WAYPOINT_ANGLES_DEG = [45, -45, 90, -90, 135, -135]; // relative to the A->B bearing
export const MAX_BISECTION_TRIES = 4; // GraphHopper calls per angle
export const MAX_ROUTES_RETURNED = 5;
export const MAX_OVERLAP = 0.8; // routes sharing more than 80% of their path are duplicates