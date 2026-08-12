import { baseUrl } from "@/lib/ui/api-client";

// Server Actions write through /api/v1 the same way pages read through it —
// no direct database access from the UI layer. Each call gets its own
// Idempotency-Key, the same header n8n/Vapi are required to send.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function apiWrite<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<ApiResult<T>> {
  const res = await fetch(new URL(path, baseUrl()), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.API_KEY ?? "",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      error: json?.error?.message ?? `Request to ${path} failed with ${res.status}`,
    };
  }
  return { ok: true, data: json as T };
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiWrite<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiWrite<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<ApiResult<T>> {
  return apiWrite<T>("DELETE", path);
}
