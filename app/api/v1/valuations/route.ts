import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toValuation } from "@/lib/api/serializers";
import { getContactByPhone, getPropertyByRef, requireContactById } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  let query = supabase
    .from("valuations")
    .select("*, properties(ref)")
    .eq("agency_id", agencyId);

  if (phone) {
    const contact = await getContactByPhone(supabase, agencyId, phone);
    if (!contact) return NextResponse.json({ valuations: [] });
    query = query.eq("contact_id", contact.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ valuations: (data ?? []).map(toValuation) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.contact_id || !body.address_line1 || !body.postcode) {
    throw new ApiError(
      "validation_failed",
      "contact_id, address_line1 and postcode are required"
    );
  }

  await requireContactById(supabase, agencyId, body.contact_id);
  const property = body.property_ref
    ? await getPropertyByRef(supabase, agencyId, body.property_ref)
    : null;

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /valuations",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("valuations")
        .insert({
          agency_id: agencyId,
          property_id: property?.id ?? null,
          contact_id: body.contact_id,
          address_line1: body.address_line1,
          address_line2: body.address_line2 ?? null,
          city: body.city ?? null,
          postcode: body.postcode,
          valuation_date: body.valuation_date ?? null,
          notes: body.notes ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return {
        status: 201,
        body: toValuation({ ...data, properties: property ? { ref: property.ref } : null }),
      };
    }
  );

  return NextResponse.json(responseBody, { status });
});
