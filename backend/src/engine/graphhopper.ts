export type LngLat = [number, number]; // longitude first, like the API

export interface RouteResult {
  distanceM: number;
  ascendM: number;
  descendM: number;
  timeMs: number; // GraphHopper's walking time, we compute running time ourselves
  coordinates: [number, number, number][]; // lng, lat, elevation
}

export class GraphHopperClient {
  constructor(private baseUrl = "http://localhost:8989") {}

  async route(points: LngLat[], customModel?: object): Promise<RouteResult> {
    const res = await fetch(`${this.baseUrl}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: "foot",
        points,
        points_encoded: false,
        elevation: true,
        custom_model: customModel,
      }),
    });

    if (!res.ok) {
      throw new Error(`GraphHopper ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const path = data.paths[0];
    return {
      distanceM: path.distance,
      ascendM: path.ascend,
      descendM: path.descend,
      timeMs: path.time,
      coordinates: path.points.coordinates,
    };
  }
}