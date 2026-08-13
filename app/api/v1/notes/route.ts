import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toNote } from "@/lib/api/serializers";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");
  const entityIds = searchParams.get("entity_ids");

  let query = supabase.from("notes").select("*").eq("agency_id", agencyId);
  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  // UI-only batch lookup — one query for every viewing/offer/etc on a page
  // instead of one per entity.
  if (entityIds) query = query.in("entity_id", entityIds.split(",").filter(Boolean));

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ notes: (data ?? []).map(toNote) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.entity_type || !body.entity_id || !body.body) {
    throw new ApiError(
      "validation_failed",
      "entity_type, entity_id and body are required"
    );
  }

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /notes",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          agency_id: agencyId,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          author_type: body.author_type ?? "ai",
          author_user_id: body.author_user_id ?? null,
          body: body.body,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: toNote(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
