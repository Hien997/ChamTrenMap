import { nanoid } from "nanoid";

/**
 * Offline queue for check-ins (PWA part 2).
 *
 * A check-in needs the visitor's GPS position *and* a network. The app is used
 * outdoors where signal drops are normal, so a failed POST used to mean the
 * walk to the checkpoint was simply lost. The payload is persisted in
 * localStorage and replayed when connectivity returns (`CheckInQueueSync`) or
 * on the next visit.
 *
 * Deliberately storage-only rather than a service worker: a worker would also
 * have to cache the app shell and the map tiles, and a stale shell is worse
 * than a delayed check-in. The server already treats a repeat as
 * `ALREADY_CHECKED_IN`, so a replay after a partial success is harmless.
 */

export const CHECKIN_QUEUE_KEY = "ctm:checkin-queue:v1";

/** The subset of `Storage` this module needs — keeps tests off the DOM. */
export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type QueuedCheckIn = {
  id: string;
  checkpointId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  locale: string;
  queuedAt: number;
};

export type QueuedCheckInInput = Omit<QueuedCheckIn, "id" | "queuedAt"> & {
  id?: string;
  queuedAt?: number;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidEntry = (value: unknown): value is QueuedCheckIn => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Partial<QueuedCheckIn>;
  return (
    typeof entry.id === "string" &&
    typeof entry.checkpointId === "string" &&
    typeof entry.locale === "string" &&
    isFiniteNumber(entry.latitude) &&
    isFiniteNumber(entry.longitude) &&
    isFiniteNumber(entry.queuedAt)
  );
};

/** Parsed queue, or `[]` for missing/corrupt storage — never throws. */
export const readCheckInQueue = (storage: StorageLike): QueuedCheckIn[] => {
  try {
    const raw = storage.getItem(CHECKIN_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
};

/**
 * Append one payload. Returns the new queue length so a caller can decide
 * whether anything was actually stored.
 */
export const enqueueCheckIn = (
  storage: StorageLike,
  input: QueuedCheckInInput,
): number => {
  const queue = readCheckInQueue(storage);
  const entry: QueuedCheckIn = {
    id: input.id ?? nanoid(),
    checkpointId: input.checkpointId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    locale: input.locale,
    queuedAt: input.queuedAt ?? Date.now(),
  };
  const next = [...queue, entry];
  storage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(next));
  return next.length;
};

/** Drop one entry by id (after the server has answered it). */
export const removeCheckIn = (
  storage: StorageLike,
  id: string,
): QueuedCheckIn[] => {
  const next = readCheckInQueue(storage).filter((entry) => entry.id !== id);
  storage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(next));
  return next;
};

/**
 * True when the failure means "no route to host" rather than a server answer.
 * `fetch` rejects with a `TypeError` for every transport-level failure; JSON
 * parse failures are included because a proxy that returns an HTML error page
 * is the same situation for the caller.
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return true;
  }
  return error instanceof Error && error.name === "SyntaxError";
};
