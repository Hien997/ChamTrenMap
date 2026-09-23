// MapLibre GL v6 loads its Web Worker from
// `new URL("./maplibre-gl-worker.mjs", import.meta.url)` (defaultWorkerUrl()
// in maplibre-gl/src/util/web_worker.ts). Bundlers (Turbopack/webpack) rewrite
// that into a hashed asset (`/_next/static/media/maplibre-gl-worker.<hash>.mjs`)
// but copy the file verbatim, so its internal relative import of
// `./maplibre-gl-shared.mjs` 404s — the worker module never evaluates and the
// map fails with "Worker failed to load. Check that the worker URL is
// correct."
//
// Workaround: serve stable copies emitted by scripts/copy-maplibre-worker.mjs
// (npm postinstall) from /public and point MapLibre at them explicitly.
// Verified by tests/maplibre-worker-asset.test.ts.
import { setWorkerUrl } from "maplibre-gl";

export const MAPLIBRE_WORKER_URL = "/maplibre-gl/maplibre-gl-worker.js";

setWorkerUrl(MAPLIBRE_WORKER_URL);