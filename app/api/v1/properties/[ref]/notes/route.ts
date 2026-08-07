import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
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
