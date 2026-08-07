import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toViewing } from "@/lib/api/serializers";

const ACTIONS = ["confirm", "cancel", "reschedule"] as const;

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const body = await request.json();

  if (!ACTIONS.includes(body.action)) {
    throw new ApiError("validation_failed", "action must be confirm, cancel or reschedule");
  }

  const updates: Record<string, unknown> = {};
  if (body.action === "confirm") {
    updates.status = "confirmed";
    if (body.scheduled_at) updates.scheduled_at = body.scheduled_at;
  } else if (body.action === "cancel") {
    updates.status = "cancelled";
  } else if (body.action === "reschedule") {
    if (!body.scheduled_at && !body.proposed_times) {
      throw new ApiError(
        "validation_failed",
        "reschedule requires scheduled_at or proposed_times"
      );
    }
    if (body.scheduled_at) updates.scheduled_at = body.scheduled_at;
    if (body.proposed_times) updates.proposed_times = body.proposed_times;
  }

  const { data, error } = await supabase
    .from("viewings")
    .update(updates)
    .eq("agency_id", agencyId)
    .eq("id", id)
    .select("*, properties(ref)")
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No viewing with id ${id}`);
  return NextResponse.json(toViewing(data));
});
