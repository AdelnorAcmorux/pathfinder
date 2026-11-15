import { readFile } from "node:fs/promises";
import { GraphHopperClient, type LngLat } from "../engine/graphhopper.js";

const client = new GraphHopperClient();

const from: LngLat = [-73.57, 45.5265]; // Parc La Fontaine
const to: LngLat = [-73.5875, 45.5048]; // Mont Royal lookout

const running = JSON.parse(
  await readFile(
    new URL("../../../routing/custom_models/running.json", import.meta.url),
    "utf8",
  ),
);

for (const [name, model] of [
  ["neutral", undefined],
  ["running", running],
] as const) {
  const r = await client.route([from, to], model);
  console.log(
    `${name}: ${Math.round(r.distanceM)} m, ascend ${Math.round(r.ascendM)} m, descend ${Math.round(r.descendM)} m`,
  );
}