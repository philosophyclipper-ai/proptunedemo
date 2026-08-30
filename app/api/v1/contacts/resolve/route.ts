import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPropertyByRef } from "@/lib/api/lookups";
import { phonesMatch } from "@/lib/api/phone";

type Relationship =
  | "seller"
  | "buyer_with_viewing"
  | "buyer_other_property"
  | "known_unrelated"
  | "not_found";

const RANK: Record<Relationship, number> = {
  seller: 0,
  buyer_with_viewing: 1,
  buyer_other_property: 2,
  known_unrelated: 3,
  not_found: 4,
};

type ContactRow = { id: string; name: string; roles: string[] };

// Voice-facing: whoever's on the phone is not certainly the contact
// themselves, so this deliberately omits surname, email and the full phone
// number — first name only. Don't add them back.
function toResolveContact(row: ContactRow) {
  return {
    id: row.id,
    first_name: row.name.split(" ")[0],
    roles: row.roles,
  };
}

// Read-only: resolves who a caller is relative to one property in a single
// call, so an n8n workflow doesn't have to fetch the property, the contact
// and the viewings separately and work out the relationship itself.
export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const propertyRef = searchParams.get("property_ref");

  if (!phone || !propertyRef) {
    throw new ApiError("validation_failed", "phone and property_ref are required");
  }

  // Unknown property is a caller error, not "nobody found" — 404, not a
  // normal not_found relationship.
  const property = await getPropertyByRef(supabase, agencyId, propertyRef);

  const { data: allContacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, name, roles, phone_primary, phone_secondary")
    .eq("agency_id", agencyId);
  if (contactsError) throw new ApiError("validation_failed", contactsError.message);

  const matches: ContactRow[] = (allContacts ?? []).filter(
    (c) => phonesMatch(c.phone_primary, phone) || phonesMatch(c.phone_secondary, phone)
  );

  if (matches.length === 0) {
    return NextResponse.json({
      found: false,
      contact: null,
      property_ref: propertyRef,
      relationship_to_property: "not_found" as Relationship,
      viewings: [],
      match_count: 0,
    });
  }

  // vendor_contact_id stays the primary/first vendor link, untouched.
  // property_contacts covers additional vendors (joint owners) on top of
  // it — both are equally authoritative for "is this the seller".
  const { data: coVendors, error: coVendorError } = await supabase
    .from("property_contacts")
    .select("contact_id")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .eq("role", "vendor");
  if (coVendorError) throw new ApiError("validation_failed", coVendorError.message);

  const vendorIds = new Set(
    [property.vendor_contact_id, ...(coVendors ?? []).map((r) => r.contact_id)].filter(Boolean)
  );

  const { data: viewings, error: viewingsError } = await supabase
    .from("viewings")
    .select("id, contact_id, status, scheduled_at")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .neq("status", "cancelled");
  if (viewingsError) throw new ApiError("validation_failed", viewingsError.message);

  function relationshipFor(contact: ContactRow): Relationship {
    if (vendorIds.has(contact.id)) return "seller";
    if ((viewings ?? []).some((v) => v.contact_id === contact.id)) return "buyer_with_viewing";
    if ((contact.roles ?? []).includes("buyer")) return "buyer_other_property";
    return "known_unrelated";
  }

  // A shared number resolves to whichever matched contact is actually
  // connected to this property, not just whichever row the query returned
  // first — that's almost certainly who's calling about it.
  const ranked = matches
    .map((contact) => ({ contact, relationship: relationshipFor(contact) }))
    .sort((a, b) => RANK[a.relationship] - RANK[b.relationship]);
  const best = ranked[0];

  const bestViewings = (viewings ?? [])
    .filter((v) => v.contact_id === best.contact.id)
    .map((v) => ({ viewing_id: v.id, status: v.status, scheduled_at: v.scheduled_at }));

  return NextResponse.json({
    found: true,
    contact: toResolveContact(best.contact),
    property_ref: propertyRef,
    relationship_to_property: best.relationship,
    viewings: bestViewings,
    match_count: matches.length,
  });
});
