import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toProperty } from "@/lib/api/serializers";
import { getPropertyByRef } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_photos(url, sort_order)")
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No property with ref ${ref}`);
  return NextResponse.json(toProperty(data));
});

const EDITABLE_FIELDS = [
  "address_line1",
  "address_line2",
  "city",
  "postcode",
  "bedrooms",
  "property_type",
  "tenure",
  "status",
  "price_qualifier",
  "asking_price",
  "home_report_value",
  "home_report_url",
  "rent_amount",
  "rent_frequency",
  "council_tax_band",
  "epc_rating",
  "vendor_contact_id",
  "viewing_calendar_id",
  "viewing_notes",
  "closing_date",
  "went_live_at",
  "negotiator_id",
  "description",
] as const;

// UI only — not a voice tool. closing_date in particular is set by humans
// only, but everything here is negotiator/admin editing, never an agent.
export const PATCH = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const existing = await getPropertyByRef(supabase, agencyId, ref);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError("validation_failed", "No editable fields were provided");
  }

  // went_live_at isn't known at onboarding anymore, so stamp it the moment
  // the listing actually goes live — but only the first time, and only if
  // nobody set it explicitly in this same request.
  const LIVE_STATUSES = ["available", "on_market"];
  const resultingStatus = updates.status !== undefined ? updates.status : existing.status;
  if (
    LIVE_STATUSES.includes(resultingStatus as string) &&
    !existing.went_live_at &&
    updates.went_live_at === undefined
  ) {
    updates.went_live_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .select("*, property_photos(url, sort_order)")
    .single();

  if (error) throw new ApiError("validation_failed", error.message);

  // Fires once, on the genuine edge into "photographed" — not on every
  // subsequent edit to an already-photographed listing. Notifies the n8n
  // workflow that drafts the property ad. Never blocks or fails the PATCH
  // itself if the webhook is unreachable or unconfigured.
  if (
    data.listing_type === "sales" &&
    data.status === "photographed" &&
    existing.status !== "photographed" &&
    process.env.PHOTOGRAPHED_WEBHOOK_URL
  ) {
    try {
      const res = await fetch(process.env.PHOTOGRAPHED_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toProperty(data)),
      });
      if (!res.ok) {
        const preview = await res.text().catch(() => "");
        console.error(
          `photographed webhook rejected: ${res.status} ${res.statusText} — ${preview.slice(0, 500)}`
        );
      }
    } catch (err) {
      console.error("photographed webhook failed", err);
    }
  }

  return NextResponse.json(toProperty(data));
});
