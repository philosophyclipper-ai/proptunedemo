import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { getPropertyByRef } from "@/lib/api/lookups";

// UI only. Notes are polymorphic and keyed by internal id, but properties
// never expose their id — so this resolves ref -> id server-side and never
// puts the id in the response.
export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("entity_type", "property")
    .eq("entity_id", property.id)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError("validation_failed", error.message);

  // Note: entity_id is the property's internal uuid — deliberately omitted
  // here, unlike the generic /notes endpoint, since properties never expose it.
  const notes = (data ?? []).map((row) => ({
    id: row.id,
    author_type: row.author_type,
    author_user_id: row.author_user_id,
    body: row.body,
    created_at: row.created_at,
  }));

  return NextResponse.json({ notes });
});

// UI only. Same ref -> id resolution as GET — lets the negotiator add a
// free-text note from the property page without the browser ever needing
// the property's internal uuid.
export const POST = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const property = await getPropertyByRef(supabase, agencyId, ref);
  const body = await request.json();

  if (!body.body) throw new ApiError("validation_failed", "body is required");

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /properties/:ref/notes",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          agency_id: agencyId,
          entity_type: "property",
          entity_id: property.id,
          author_type: "user",
          body: body.body,
        })
        .select("id, author_type, author_user_id, body, created_at")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: data };
    }
  );

  return NextResponse.json(responseBody, { status });
});
