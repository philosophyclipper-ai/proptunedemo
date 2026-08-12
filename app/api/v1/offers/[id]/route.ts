import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toOffer } from "@/lib/api/serializers";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const body = await request.json();

  const { data: existing, error: fetchError } = await supabase
    .from("offers")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new ApiError("validation_failed", fetchError.message);
  if (!existing) throw new ApiError("not_found", `No offer with id ${id}`);

  const updates: Record<string, unknown> = {};

  // note_of_interest → offer upgrade: providing an amount promotes it in place.
  if (existing.type === "note_of_interest" && body.amount != null) {
    updates.type = "offer";
    updates.amount = body.amount;
  } else if (body.amount !== undefined) {
    updates.amount = body.amount;
  }

  for (const field of ["solicitor_contact_id", "received_via", "status"]) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("offers")
    .update(updates)
    .eq("id", id)
    .select("*, properties(ref), offer_contacts(contacts(id,name,phone_primary))")
    .single();

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json(toOffer(data));
});
