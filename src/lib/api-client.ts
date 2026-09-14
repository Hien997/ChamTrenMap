/** Shared client-side shape for this app’s JSON API envelope. */
export interface ApiEnvelope<TData> {
  ok: boolean;
  data?: TData;
  error?: { code: string; message: string; details?: unknown };
}

export type ApiEnvelopeError = Extract<ApiEnvelope<never>, { ok: false }>["error"];

/**
 * Fetch a route that returns this app’s JSON envelope and throw on an error
 * response so callers only handle success data.
 *
 * This wrapper exists so the envelope contract is explicit in one place
 * instead of re-interpreted by each consumer.
 */
export async function fetchApiOk<TData>(
  url: string,
  init?: RequestInit,
): Promise<TData> {
  const response = await fetch(url, init);
  const json = (await response.json()) as ApiEnvelope<TData>;

  if (!response.ok || !json.ok || !json.data) {
    const error = json.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw Object.assign(new Error(error.message ?? "Request failed"), {
      code: error.code,
      details: error.details,
      status: response.status,
    });
  }

  return json.data;
}
