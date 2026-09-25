/**
 * Map load orchestration — the deep module for the map's load lifecycle.
 *
 * reduceMapLoad is a pure `reduce(state, event) → state` machine covering
 * loading → fallback → give-up. MapLibreMap only translates maplibre events
 * into MapLoadEvents and renders the state it receives.
 *
 * Purity contract: no maplibre-gl and no React imports — the interface is the
 * test surface, so tests pin transitions without mocking maplibre.
 */

export type MapLoadStatus = "loading" | "ready" | "error";

export type MapLoadStyleMode = "primary" | "fallback";

export interface MapLoadState {
  status: MapLoadStatus;
  /** True when the load budget (timeout) — not a generic failure — errored. */
  timedOut: boolean;
  /** Retry counter: the component rebuilds the map when this changes. */
  attempt: number;
  /** Which style host the next map construction uses. */
  styleMode: MapLoadStyleMode;
  /** The maplibre "load" event fired for the current construction. */
  loaded: boolean;
  /** At least one tile rendered for the current construction. */
  anyTileRendered: boolean;
  /** Tile-level errors accumulated for the current construction. */
  tileErrorCount: number;
}

export type MapLoadEvent =
  | { type: "load" }
  | { type: "timeout"; styleHasTiles: boolean }
  | { type: "tileRendered" }
  | { type: "tileError" }
  | { type: "styleError" }
  | { type: "constructorFailed" }
  | { type: "retry" };

export const initialMapLoadState: MapLoadState = {
  status: "loading",
  timedOut: false,
  attempt: 0,
  styleMode: "primary",
  loaded: false,
  anyTileRendered: false,
  tileErrorCount: 0,
};

/** Tile errors tolerated before escalating to fallback / give-up. */
export const TILE_FAILURE_ESCALATION_THRESHOLD = 3;

/**
 * Fresh per-construction state — mirrors the old effect re-run, which reset
 * status/timedOut and allocated new counters (loaded, tiles, errors).
 */
function restarting(
  state: MapLoadState,
  styleMode: MapLoadStyleMode,
): MapLoadState {
  return {
    status: "loading",
    timedOut: false,
    attempt: state.attempt,
    styleMode,
    loaded: false,
    anyTileRendered: false,
    tileErrorCount: 0,
  };
}

export function reduceMapLoad(
  state: MapLoadState,
  event: MapLoadEvent,
): MapLoadState {
  switch (event.type) {
    case "retry":
      return { ...restarting(state, "primary"), attempt: state.attempt + 1 };

    case "load":
      // Parity: maplibre can report "load" after an error screen; the old
      // handleLoad set "ready" unconditionally.
      if (state.status === "ready" && state.loaded) return state;
      return { ...state, loaded: true, status: "ready" };

    case "tileRendered":
      if (state.anyTileRendered) return state;
      return { ...state, anyTileRendered: true };

    case "constructorFailed":
      if (state.status === "error") return state;
      return { ...state, status: "error" };

    case "styleError":
      // Only a pre-load style failure is fatal; noise after the map loaded
      // or after the error screen is absorbed (same reference, no render).
      if (state.status !== "loading" || state.loaded) return state;
      return { ...state, status: "error" };

    case "tileError": {
      if (state.status === "error") return state;
      const tileErrorCount = state.tileErrorCount + 1;
      if (
        state.anyTileRendered ||
        tileErrorCount < TILE_FAILURE_ESCALATION_THRESHOLD
      ) {
        return { ...state, tileErrorCount };
      }
      // Threshold reached with no tile: escalate once, then give up.
      if (state.styleMode === "fallback") {
        return { ...state, tileErrorCount, status: "error" };
      }
      return restarting(state, "fallback");
    }

    case "timeout": {
      // Terminal states absorb late timers (the old code clearTimeout'd;
      // absorption makes that ordering testable).
      if (state.status === "error") return state;
      // Healthy loads ignore the budget: already loaded and the style
      // either needs no tiles or at least one arrived.
      const healthy =
        state.loaded && (!event.styleHasTiles || state.anyTileRendered);
      if (healthy) return state;
      if (state.styleMode === "fallback") {
        return { ...state, status: "error", timedOut: true };
      }
      return restarting(state, "fallback");
    }
  }
}
