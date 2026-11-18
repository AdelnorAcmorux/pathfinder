import { readFileSync, writeFileSync } from "node:fs";
import { GraphHopperClient, type LngLat } from "../engine/graphhopper.js";
import { generateAToB } from "../generator/generate.js";

const runningModel = JSON.parse(readFileSync("../routing/custom_models/running.json", "utf8"));

// Use the same A and B you used for your last run
//const A: LngLat = [-73.587, 45.5035];
//const B: LngLat = [-73.6277, 45.53];
const TARGET_M = 5_000;

// test neibhboring points to see if the route is stable
const A: LngLat = [-73.75546, 45.625203];
const B: LngLat = [-73.745436, 45.637052];

const res = await generateAToB(new GraphHopperClient(), A, B, TARGET_M, runningModel);

console.log("notices:", res.notices);
for (const r of res.routes) {
  console.log(`${Math.round(r.distanceM)} m, +${Math.round(r.ascendM)} m climb`);
}

const geojson = {
  type: "FeatureCollection",
  features: res.routes.map((r, i) => ({
    type: "Feature",
    properties: { name: `route ${i + 1}`, distanceM: Math.round(r.distanceM) },
    geometry: { type: "LineString", coordinates: r.coordinates },
  })),
};
writeFileSync("routes.geojson", JSON.stringify(geojson));