import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { getPropertyByRef } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);

  const canCommit = property.viewing_conducted_by !== "vendor";

  // No Google Calendar integration in this demo, so agent-led properties
  // always report no free slots — a real deployment reads free/busy from
  // viewing_calendar_id here.
  return NextResponse.json({
    ref: property.ref,
    conducted_by: property.viewing_conducted_by,
    viewing_notes: property.viewing_notes,
    can_commit: canCommit,
    free_slots: [],
  });
});
