"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Rows per page — the list asks for exactly this, then more on demand. */
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

/** One page from `GET /api/admin/*?q=&take=&offset=` (the admin envelope). */
interface ListPageEnvelope<T> {
  ok?: boolean;
  items?: T[];
  total?: number;
  error?: string;
}

export interface PaginatedAdminList<T> {
  /** `null` while the first page of the current query is loading. */
  items: T[] | null;
  /** Match count for the current query (not just what's loaded so far). */
  total: number;
  /** Live text in the search box (updates per keystroke). */
  search: string;
  setSearch: (value: string) => void;
  /** The query the visible rows actually reflect — debounced + trimmed. */
  appliedQuery: string;
  clearSearch: () => void;
  /** First-page load failed; the list itself never rendered. */
  error: string | null;
  retry: () => void;
  /** True while fewer rows are loaded than the server says match. */
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  /** A load-more request failed; the button becomes the retry affordance. */
  moreError: string | null;
  /** Optimistic removal after a confirmed delete; keeps `total` honest. */
  removeItem: (id: string) => void;
  /** Observed sentinel div: nearing the viewport triggers `loadMore`. */
  sentinelRef: { current: HTMLDivElement | null };
}

/**
 * Shared search + infinite-scroll state for the admin list pages.
 *
 * Server contract: `GET <endpoint>?q=&take=10&offset=N` →
 * `{ ok: true, items, total }`.
 *
 * - Typing debounces 300 ms, then resets to offset 0 behind a skeleton.
 * - `loadMore` appends the next page, guarded against double fetches and
 *   against responses from a query that has since changed (epoch check).
 * - An IntersectionObserver on `sentinelRef` calls `loadMore` when the
 *   sentinel nears the viewport; the pages *also* render an explicit
 *   "Load more" button so keyboard users and IO-less browsers can load too.
 */
export function usePaginatedAdminList<T extends { id: string }>(
  endpoint: string,
): PaginatedAdminList<T> {
  const [search, setSearch] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [items, setItems] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /** Next server offset for `loadMore`; reset whenever a first page starts. */
  const offsetRef = useRef(0);
  /** Bumped per first page so stale responses bow out via comparison. */
  const epochRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Always-fresh mirrors: they keep `loadMore` stable (one identity for the
  // observer) while still reading the latest list state at call time. Synced
  // in an effect — React forbids writing refs during render.
  const stateRef = useRef({
    items: null as T[] | null,
    total: 0,
    error: null as string | null,
  });
  const queryRef = useRef(appliedQuery);
  const appliedRef = useRef(appliedQuery);

  useEffect(() => {
    stateRef.current = { items, total, error };
    queryRef.current = appliedQuery;
    appliedRef.current = appliedQuery;
  }, [items, total, error, appliedQuery]);

  // UI reset for a brand-new first page. Lives here (not in the fetch
  // effect) because react-hooks/set-state-in-effect forbids synchronous
  // setState in an effect body — callers are timers/event handlers only.
  const resetPageState = useCallback(() => {
    setItems(null);
    setTotal(0);
    setError(null);
    setMoreError(null);
    setLoadingMore(false);
  }, []);

  // Debounce keystrokes into the query the server actually sees.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = search.trim();
      // Ignore churn that doesn't change the query (e.g. a trailing space),
      // otherwise the list would clear with no fetch to refill it.
      if (next === appliedRef.current) return;
      resetPageState();
      setAppliedQuery(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search, resetPageState]);

  // First page for the current query (also runs for retry/endpoint changes).
  // State resets belong to the callers (debounce/retry); this body only
  // touches refs and the async chain, per react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    const epoch = ++epochRef.current;
    offsetRef.current = 0;
    loadingMoreRef.current = false;

    const params = new URLSearchParams({
      q: appliedQuery,
      take: String(PAGE_SIZE),
      offset: "0",
    });
    fetch(`${endpoint}?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: ListPageEnvelope<T>) => {
        if (cancelled || epoch !== epochRef.current) return;
        if (!json.ok || !Array.isArray(json.items)) {
          throw new Error(json.error || "Failed to load");
        }
        setItems(json.items);
        setTotal(json.total ?? json.items.length);
        offsetRef.current = json.items.length;
      })
      .catch((err: Error) => {
        if (cancelled || epoch !== epochRef.current) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, appliedQuery, reloadKey]);

  const loadMore = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.error !== null) return;
    if (snapshot.items === null || snapshot.items.length >= snapshot.total) {
      return;
    }
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setMoreError(null);

    const epoch = epochRef.current;
    const params = new URLSearchParams({
      q: queryRef.current,
      take: String(PAGE_SIZE),
      offset: String(offsetRef.current),
    });
    fetch(`${endpoint}?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: ListPageEnvelope<T>) => {
        if (epoch !== epochRef.current) return;
        if (!json.ok || !Array.isArray(json.items)) {
          throw new Error(json.error || "Failed to load more");
        }
        setItems((prev) => [...(prev ?? []), ...json.items!]);
        setTotal(json.total ?? snapshot.total);
        offsetRef.current += json.items!.length;
      })
      .catch((err: Error) => {
        if (epoch !== epochRef.current) return;
        setMoreError(err.message);
      })
      .finally(() => {
        if (epoch !== epochRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [endpoint]);

  const retry = useCallback(() => {
    resetPageState();
    setReloadKey((key) => key + 1);
  }, [resetPageState]);

  const clearSearch = useCallback(() => setSearch(""), []);

  const removeItem = useCallback((id: string) => {
    const existed =
      stateRef.current.items?.some((item) => item.id === id) ?? false;
    if (!existed) return;
    setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
    setTotal((prev) => Math.max(0, prev - 1));
    offsetRef.current = Math.max(0, offsetRef.current - 1);
  }, []);

  // `loadMore` is identity-stable (`[endpoint]` deps), so this subscribes
  // once in practice; listing it satisfies exhaustive-deps without churn.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      // Start fetching slightly before the sentinel actually scrolls in.
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    items,
    total,
    search,
    setSearch,
    appliedQuery,
    clearSearch,
    error,
    retry,
    hasMore: items !== null && items.length < total,
    loadMore,
    loadingMore,
    moreError,
    removeItem,
    sentinelRef,
  };
}
