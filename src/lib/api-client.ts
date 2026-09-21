export interface ApiEnvelope<TData> {
  ok: boolean;
  data?: TData;
  error?: { code: string; message: string; details?: unknown };
}

export type ApiEnvelopeError = Extract<ApiEnvelope<never>, { ok: false }>["error"];

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
