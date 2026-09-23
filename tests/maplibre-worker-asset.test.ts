import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { getWorkerUrl } from "maplibre-gl";

import { MAPLIBRE_WORKER_URL } from "@/components/map/maplibre-worker-config";

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, "public", "maplibre-gl");
const workerFile = path.join(outDir, "maplibre-gl-worker.js");
const sharedFile = path.join(outDir, "maplibre-gl-shared.js");

/**
 * MapLibre's default worker URL resolution breaks under bundlers: Turbopack
 * rewrites `new URL("./maplibre-gl-worker.mjs", import.meta.url)` to a hashed
 * asset but copies it verbatim, so the worker's un-hashed relative import of
 * `./maplibre-gl-shared.mjs` 404s and the map fails with "Worker failed to
 * load". These tests keep the /public workaround honest: the copies must be
 * regenerable from the installed package and be what maplibre actually uses.
 */
describe("maplibre worker assets (bundler workaround)", () => {
  beforeAll(() => {
    execFileSync(
      process.execPath,
      [path.join(projectRoot, "scripts", "copy-maplibre-worker.mjs")],
      { stdio: "inherit" },
    );
  });

  it("publishes the worker and its shared dependency as .js files", () => {
    expect(existsSync(workerFile)).toBe(true);
    expect(existsSync(sharedFile)).toBe(true);
  });

  it("rewrites the worker's relative import and drops source map comments", () => {
    const worker = readFileSync(workerFile, "utf8");
    expect(worker).toContain("./maplibre-gl-shared.js");
    expect(worker).not.toContain("maplibre-gl-shared.mjs");
    expect(worker).not.toContain("sourceMappingURL");
    expect(readFileSync(sharedFile, "utf8")).not.toContain("sourceMappingURL");
  });

  it("published copy matches the installed maplibre-gl version", () => {
    const require = createRequire(import.meta.url);
    const { version } = require("maplibre-gl/package.json");
    expect(readFileSync(workerFile, "utf8")).toContain(
      `maplibre-gl-js/blob/v${version}/LICENSE.txt`,
    );
  });

  it("wires maplibre's worker URL to the published copy", () => {
    expect(MAPLIBRE_WORKER_URL).toBe("/maplibre-gl/maplibre-gl-worker.js");
    expect(getWorkerUrl()).toBe(MAPLIBRE_WORKER_URL);
  });
});