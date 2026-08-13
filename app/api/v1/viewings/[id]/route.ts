import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toViewing } from "@/lib/api/serializers";

const ACTIONS = ["confirm", "cancel", "reschedule"] as const;
const DIRECT_FIELDS = [
  "status",
  "scheduled_at",
  "proposed_times",
  "mortgage_status",
  "buyer_property_status",
] as const;

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (body.action !== undefined) {
    // find_viewings/cancel_or_reschedule_viewing voice tool shape.
    if (!ACTIONS.includes(body.action)) {
      throw new ApiError("validation_failed", "action must be confirm, cancel or reschedule");
    }
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
  } else {
    // UI edit — set fields directly, no action semantics required.
    for (const field of DIRECT_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (Object.keys(updates).length === 0) {
      throw new ApiError("validation_failed", "No editable fields were provided");
    }
  }

  // A viewing can't be requested/confirmed without a time on file — if this
  // update would leave it (still) timeless, tag it incomplete instead.
  if (updates.status === "requested" || updates.status === "confirmed") {
    const { data: current } = await supabase
      .from("viewings")
      .select("scheduled_at, proposed_times")
      .eq("agency_id", agencyId)
      .eq("id", id)
      .maybeSingle();
    const scheduledAt =
      updates.scheduled_at !== undefined ? updates.scheduled_at : current?.scheduled_at;
    const proposedTimes =
      updates.proposed_times !== undefined ? updates.proposed_times : current?.proposed_times;
    const hasTime = Boolean(scheduledAt) || (Array.isArray(proposedTimes) && proposedTimes.length > 0);
    if (!hasTime) updates.status = "incomplete";
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

export const DELETE = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const { data: existing } = await supabase
    .from("viewings")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();
  if (!existing) throw new ApiError("not_found", `No viewing with id ${id}`);

  await supabase
    .from("notes")
    .delete()
    .eq("agency_id", agencyId)
    .eq("entity_type", "viewing")
    .eq("entity_id", id);
  await supabase
    .from("tasks")
    .delete()
    .eq("agency_id", agencyId)
    .eq("entity_type", "viewing")
    .eq("entity_id", id);

  const { error } = await supabase
    .from("viewings")
    .delete()
    .eq("agency_id", agencyId)
    .eq("id", id);
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ deleted: true });
});
