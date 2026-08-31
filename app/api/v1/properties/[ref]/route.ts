import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toProperty } from "@/lib/api/serializers";
import { ensureVendorContact, getPropertyByRef } from "@/lib/api/lookups";
import { attachPropertyVendorsEmbed, parseEmbed, withEmbed } from "@/lib/api/embed";

const PROPERTY_EMBEDS = ["vendors"];

export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const embeds = parseEmbed(searchParams, PROPERTY_EMBEDS);

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_photos(url, sort_order)")
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No property with ref ${ref}`);

  if (embeds.includes("vendors")) {
    const entry = await attachPropertyVendorsEmbed(supabase, agencyId, data.id);
    return NextResponse.json(withEmbed(toProperty(data), entry));
  }
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

  await logAuditNotes(supabase, agencyId, existing, updates, data.id);

  // vendors/vendor_contacts is authoritative for ownership; this form only
  // knows a single vendor_contact_id, so a change here means "make sure
  // this contact is on the vendor record", not "replace" — see
  // ensureVendorContact's own comment for why it never removes anyone.
  if (updates.vendor_contact_id) {
    await ensureVendorContact(supabase, agencyId, data.id, updates.vendor_contact_id as string);
  }

  return NextResponse.json(toProperty(data));
});

// Status and price changes have no dedicated history table — they're
// folded into the same notes/timeline pipe as everything else, as
// system-authored entries, so the property timeline is a genuine audit
// trail rather than missing its most basic events.
const humanize = (value: string) => value.replace(/_/g, " ");
const money = (value: number) => `£${value.toLocaleString("en-GB")}`;

async function logAuditNotes(
  supabase: SupabaseClient,
  agencyId: string,
  existing: Record<string, unknown>,
  updates: Record<string, unknown>,
  propertyId: string
) {
  const entries: string[] = [];

  if (updates.status !== undefined && updates.status !== existing.status) {
    entries.push(
      `Status changed from ${humanize(existing.status as string)} to ${humanize(updates.status as string)}`
    );
  }
  if (updates.asking_price !== undefined && updates.asking_price !== existing.asking_price) {
    entries.push(
      existing.asking_price == null
        ? `Asking price set to ${money(updates.asking_price as number)}`
        : `Asking price changed from ${money(existing.asking_price as number)} to ${money(updates.asking_price as number)}`
    );
  }
  if (updates.rent_amount !== undefined && updates.rent_amount !== existing.rent_amount) {
    entries.push(
      existing.rent_amount == null
        ? `Rent set to ${money(updates.rent_amount as number)}`
        : `Rent changed from ${money(existing.rent_amount as number)} to ${money(updates.rent_amount as number)}`
    );
  }

  if (entries.length === 0) return;

  await supabase.from("notes").insert(
    entries.map((body) => ({
      agency_id: agencyId,
      entity_type: "property",
      entity_id: propertyId,
      author_type: "user",
      body,
    }))
  );
}

// UI only — deletes the listing and everything hanging off it. Voice/n8n
// never get this; a property going away entirely is a negotiator decision,
// never something an agent should be able to trigger.
export const DELETE = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const existing = await getPropertyByRef(supabase, agencyId, ref);
  const propertyId = existing.id as string;

  const [{ data: viewings }, { data: offers }, { data: maintenance }] = await Promise.all([
    supabase.from("viewings").select("id").eq("agency_id", agencyId).eq("property_id", propertyId),
    supabase.from("offers").select("id").eq("agency_id", agencyId).eq("property_id", propertyId),
    supabase
      .from("maintenance_issues")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("property_id", propertyId),
  ]);

  const viewingIds = (viewings ?? []).map((v) => v.id);
  const offerIds = (offers ?? []).map((o) => o.id);
  const maintenanceIds = (maintenance ?? []).map((m) => m.id);

  const childEntityFilter = [
    `and(entity_type.eq.property,entity_id.eq.${propertyId})`,
    ...(viewingIds.length ? [`and(entity_type.eq.viewing,entity_id.in.(${viewingIds.join(",")}))`] : []),
    ...(offerIds.length ? [`and(entity_type.eq.offer,entity_id.in.(${offerIds.join(",")}))`] : []),
    ...(maintenanceIds.length
      ? [`and(entity_type.eq.maintenance_issue,entity_id.in.(${maintenanceIds.join(",")}))`]
      : []),
  ].join(",");

  await supabase.from("notes").delete().eq("agency_id", agencyId).or(childEntityFilter);
  await supabase.from("tasks").delete().eq("agency_id", agencyId).or(childEntityFilter);

  // offer_contacts cascades automatically when its offers are deleted.
  await supabase.from("viewings").delete().eq("agency_id", agencyId).eq("property_id", propertyId);
  await supabase.from("offers").delete().eq("agency_id", agencyId).eq("property_id", propertyId);
  await supabase
    .from("maintenance_issues")
    .delete()
    .eq("agency_id", agencyId)
    .eq("property_id", propertyId);

  // Valuations may exist independently of a property — decouple rather
  // than delete, preserving the valuation history.
  await supabase
    .from("valuations")
    .update({ property_id: null })
    .eq("agency_id", agencyId)
    .eq("property_id", propertyId);

  // vendors has no ON DELETE CASCADE from properties (vendor_contacts
  // cascades from vendors, so deleting the vendors row is enough) —
  // without this, deleting a property with a vendor record fails outright
  // on the FK instead of cleaning up. property_contacts has the same gap.
  await supabase.from("vendors").delete().eq("agency_id", agencyId).eq("property_id", propertyId);
  await supabase
    .from("property_contacts")
    .delete()
    .eq("agency_id", agencyId)
    .eq("property_id", propertyId);

  // property_photos cascades automatically (on delete cascade).
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("agency_id", agencyId)
    .eq("ref", ref);
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ deleted: true });
});
