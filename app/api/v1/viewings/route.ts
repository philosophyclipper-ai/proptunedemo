import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toViewing } from "@/lib/api/serializers";
import { getContactByPhone, getPropertyByRef, requireContactById } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const propertyRef = searchParams.get("property_ref");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("viewings")
    .select("*, properties(ref)")
    .eq("agency_id", agencyId);

  if (phone) {
    const contact = await getContactByPhone(supabase, agencyId, phone);
    if (!contact) return NextResponse.json({ viewings: [] });
    query = query.eq("contact_id", contact.id);
  }
  if (propertyRef) {
    const property = await getPropertyByRef(supabase, agencyId, propertyRef);
    query = query.eq("property_id", property.id);
  }
  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ viewings: (data ?? []).map(toViewing) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.property_ref || !body.contact_id) {
    throw new ApiError("validation_failed", "property_ref and contact_id are required");
  }

  const property = await getPropertyByRef(supabase, agencyId, body.property_ref);
  await requireContactById(supabase, agencyId, body.contact_id);

  // Voice/n8n bookings never send this — the vendor-led/agency-led split
  // above decides status for them. The CRM UI sends it explicitly so a
  // staff-entered viewing can start unconfirmed regardless of who leads it.
  const explicitStatus =
    body.status === "confirmed" || body.status === "requested" ? body.status : undefined;

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /viewings",
    idempotencyKey,
    async () => {
      // No property-level flag decides this anymore — whoever's booking
      // (staff or an AI agent) has read the property's viewing_notes and
      // decides which shape fits: proposed_times when times need to be put
      // to someone before anything's fixed, scheduled_at when a slot can be
      // committed directly. Neither given means there's nothing to work
      // with yet, so it's incomplete rather than guessed at.
      const hasProposedTimes = Boolean(body.proposed_times && body.proposed_times.length > 0);
      const hasScheduledAt = Boolean(body.scheduled_at);

      if (hasProposedTimes && !hasScheduledAt) {
        const { data: viewing, error } = await supabase
          .from("viewings")
          .insert({
            agency_id: agencyId,
            property_id: property.id,
            contact_id: body.contact_id,
            status: explicitStatus ?? "requested",
            proposed_times: body.proposed_times,
          })
          .select("*")
          .single();

        if (error) throw new ApiError("validation_failed", error.message);

        await supabase.from("tasks").insert({
          agency_id: agencyId,
          entity_type: "viewing",
          entity_id: viewing.id,
          title: `Confirm viewing time for ${property.ref}`,
          body: `Proposed times: ${body.proposed_times.join(", ")}`,
        });

        return {
          status: 201,
          body: toViewing({ ...viewing, properties: { ref: property.ref } }),
        };
      }

      const resolvedStatus = hasScheduledAt ? (explicitStatus ?? "confirmed") : "incomplete";

      const { data: viewing, error } = await supabase
        .from("viewings")
        .insert({
          agency_id: agencyId,
          property_id: property.id,
          contact_id: body.contact_id,
          status: resolvedStatus,
          scheduled_at: hasScheduledAt ? body.scheduled_at : null,
          calendar_event_id: resolvedStatus === "confirmed" ? `demo-${crypto.randomUUID()}` : null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return {
        status: 201,
        body: toViewing({ ...viewing, properties: { ref: property.ref } }),
      };
    }
  );

  return NextResponse.json(responseBody, { status });
});
