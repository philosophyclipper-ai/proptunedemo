import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toMaintenanceIssue } from "@/lib/api/serializers";
import { getContactByPhone, getPropertyByRef } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const propertyRef = searchParams.get("property_ref");

  let query = supabase
    .from("maintenance_issues")
    .select("*, properties(ref)")
    .eq("agency_id", agencyId);

  if (phone) {
    const contact = await getContactByPhone(supabase, agencyId, phone);
    if (!contact) return NextResponse.json({ maintenance_issues: [] });
    query = query.eq("contact_id", contact.id);
  }
  if (propertyRef) {
    const property = await getPropertyByRef(supabase, agencyId, propertyRef);
    query = query.eq("property_id", property.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ maintenance_issues: (data ?? []).map(toMaintenanceIssue) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.property_ref || !body.description) {
    throw new ApiError("validation_failed", "property_ref and description are required");
  }

  const property = await getPropertyByRef(supabase, agencyId, body.property_ref);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /maintenance",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("maintenance_issues")
        .insert({
          agency_id: agencyId,
          property_id: property.id,
          contact_id: body.contact_id ?? null,
          description: body.description,
          urgency: body.urgency ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return {
        status: 201,
        body: toMaintenanceIssue({ ...data, properties: { ref: property.ref } }),
      };
    }
  );

  return NextResponse.json(responseBody, { status });
});
