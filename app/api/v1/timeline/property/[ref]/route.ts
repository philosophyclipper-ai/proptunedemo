import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toTimelineEntry } from "@/lib/api/serializers";
import { getPropertyByRef } from "@/lib/api/lookups";

// UI only. Resolves ref -> id server-side, same as /properties/:ref/notes —
// properties never expose their internal id.
export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);

  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .order("occurred_at", { ascending: false });

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json({ timeline: (data ?? []).map(toTimelineEntry) });
});
