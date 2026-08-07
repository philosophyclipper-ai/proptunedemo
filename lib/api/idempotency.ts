import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Every write accepts an Idempotency-Key header (the Vapi call id in
 * practice). Replaying the same key against the same route returns the
 * original response instead of writing twice. Requests without a key are
 * just executed — there's nothing to dedupe against.
 */
export async function withIdempotency<T>(
  supabase: SupabaseClient,
  agencyId: string,
  route: string,
  idempotencyKey: string | null,
  run: () => Promise<{ status: number; body: T }>
): Promise<{ status: number; body: T }> {
  if (!idempotencyKey) {
    return run();
  }

  const { data: existing } = await supabase
    .from("api_idempotency_keys")
    .select("response_status, response_body")
    .eq("agency_id", agencyId)
    .eq("route", route)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { status: existing.response_status, body: existing.response_body as T };
  }

  const result = await run();

  await supabase.from("api_idempotency_keys").insert({
    agency_id: agencyId,
    route,
    idempotency_key: idempotencyKey,
    response_status: result.status,
    response_body: result.body as object,
  });

  return result;
}
