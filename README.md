# Pathfinder

A web app for runners that generates running routes (loop, out-and-back, A to B) from a start point, a target distance and a few preferences. Quebec first.

## Status

Early development. Currently setting up the routing engine.

## Planned stack

- Routing: GraphHopper (foot profile, custom models) on OpenStreetMap data
- Backend: Node.js, TypeScript, Fastify
- Frontend: React, TypeScript, MapLibre GL JS

## Repo layout

- `routing/`: GraphHopper config and local setup (data and JAR are not committed)
- `backend/`: API and route generator
- `frontend/`: web app

## Local routing setup

Requires Java 21. Download the GraphHopper web JAR and the Quebec extract from Geofabrik into `routing/`. Detailed steps coming once the setup is validated.

Map data: © OpenStreetMap contributors.
