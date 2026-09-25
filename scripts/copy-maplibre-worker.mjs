#!/usr/bin/env node
/**
 * Publish stable (un-hashed) copies of the MapLibre GL worker files into
 * `public/maplibre-gl/`.
 *
 * Why this exists: MapLibre GL v6 resolves its worker URL against
 * `import.meta.url` (see `defaultWorkerUrl()` in
 * `maplibre-gl/src/util/web_worker.ts`). Bundlers such as Turbopack rewrite
 * that expression to a hashed static asset
 * (`/_next/static/media/maplibre-gl-worker.<hash>.mjs`) but copy the file
 * verbatim — its internal `import … from "./maplibre-gl-shared.mjs"` keeps
 * pointing at an un-hashed sibling that is never emitted (404). The module
 * worker then fails to evaluate and every map dies with:
 *   "Worker failed to load. Check that the worker URL is correct."
 *
 * The copies published here keep their original relative import (rewritten to
 * `.js` so the MIME type is always JavaScript under
 * `X-Content-Type-Options: nosniff`) and are referenced explicitly via
 * `setWorkerUrl()` in `src/components/map/maplibre-worker-config.ts`.
 * Runs on npm `postinstall`; verified by
 * `tests/maplibre-worker-asset.test.ts`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const require = createRequire(import.meta.url);

const { version } = require("maplibre-gl/package.json");
const distDir = path.join(projectRoot, "node_modules", "maplibre-gl", "dist");
const outDir = path.join(projectRoot, "public", "maplibre-gl");

const readDistFile = (name) =>
  readFileSync(path.join(distDir, name), "utf8")
    // Source maps stay in node_modules; the published copies are verbatim JS.
    .replace(/\/\/# sourceMappingURL=[^\n]*/g, "")
    .trimEnd();

const shared = readDistFile("maplibre-gl-shared.mjs");
const worker = readDistFile("maplibre-gl-worker.mjs").replaceAll(
  "./maplibre-gl-shared.mjs",
  "./maplibre-gl-shared.js",
);

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "maplibre-gl-shared.js"), `${shared}\n`);
writeFileSync(path.join(outDir, "maplibre-gl-worker.js"), `${worker}\n`);

console.log(
  `Copied MapLibre GL worker assets (maplibre-gl@${version}) to public/maplibre-gl/`,
);
