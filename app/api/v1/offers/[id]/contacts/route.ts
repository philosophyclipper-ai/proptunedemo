import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { requireContactById } from "@/lib/api/lookups";

// UI only — attaches an additional contact to an offer/application (a
// couple, multiple applicants) alongside the primary offers.contact_id.
export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.contact_id) {
    throw new ApiError("validation_failed", "contact_id is required");
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();
  if (!offer) throw new ApiError("not_found", `No offer with id ${id}`);

  await requireContactById(supabase, agencyId, body.contact_id);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /offers/:id/contacts",
    idempotencyKey,
    async () => {
      const { error } = await supabase
        .from("offer_contacts")
        .upsert(
          { agency_id: agencyId, offer_id: id, contact_id: body.contact_id },
          { onConflict: "offer_id,contact_id" }
        );

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: { offer_id: id, contact_id: body.contact_id } };
    }
  );

  return NextResponse.json(responseBody, { status });
});
