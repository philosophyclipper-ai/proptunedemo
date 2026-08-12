import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toOffer } from "@/lib/api/serializers";
import { getContactByPhone, getPropertyByRef, requireContactById } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const propertyRef = searchParams.get("property_ref");
  const phone = searchParams.get("phone");
  const type = searchParams.get("type");

  let query = supabase
    .from("offers")
    .select("*, properties(ref), offer_contacts(contacts(id,name,phone_primary))")
    .eq("agency_id", agencyId);

  if (propertyRef) {
    const property = await getPropertyByRef(supabase, agencyId, propertyRef);
    query = query.eq("property_id", property.id);
  }
  if (phone) {
    const contact = await getContactByPhone(supabase, agencyId, phone);
    if (!contact) return NextResponse.json({ offers: [] });
    query = query.eq("contact_id", contact.id);
  }
  if (type) query = query.eq("type", type);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ offers: (data ?? []).map(toOffer) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.property_ref || !body.contact_id || !body.type) {
    throw new ApiError(
      "validation_failed",
      "property_ref, contact_id and type are required"
    );
  }
  if (body.type === "offer" && (body.amount === undefined || body.amount === null)) {
    throw new ApiError("validation_failed", "amount is required for an offer");
  }
  if (body.type === "note_of_interest" && body.amount != null) {
    throw new ApiError("validation_failed", "note_of_interest cannot carry an amount");
  }

  const property = await getPropertyByRef(supabase, agencyId, body.property_ref);
  await requireContactById(supabase, agencyId, body.contact_id);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /offers",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("offers")
        .insert({
          agency_id: agencyId,
          property_id: property.id,
          contact_id: body.contact_id,
          type: body.type,
          amount: body.amount ?? null,
          solicitor_contact_id: body.solicitor_contact_id ?? null,
          received_via: body.received_via ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return {
        status: 201,
        body: toOffer({ ...data, properties: { ref: property.ref } }),
      };
    }
  );

  return NextResponse.json(responseBody, { status });
});
