import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toTimelineEntry } from "@/lib/api/serializers";

export const GET = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("property_id", id)
    .order("occurred_at", { ascending: false });

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json({ timeline: (data ?? []).map(toTimelineEntry) });
});
