import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";

// vendors/vendor_contacts is authoritative for property ownership;
// vendor_contact_id is a legacy mirror. Any write path that sets
// vendor_contact_id must call this too, or the two silently disagree and
// the contact stops being recognised as the seller anywhere that reads
// vendors instead (contacts/resolve, embed=vendors).
//
// Adds the contact to the property's vendor record — creating the record
// if none exists yet — without ever removing an existing vendor_contacts
// row. A single vendor_contact_id field has no way to express "replace"
// vs "add a joint owner", and silently dropping a co-vendor the caller
// doesn't know about is worse than leaving one that's merely stale.
export async function ensureVendorContact(
  supabase: SupabaseClient,
  agencyId: string,
  propertyId: string,
  contactId: string
) {
  const { data: existingVendor, error: vendorLookupError } = await supabase
    .from("vendors")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (vendorLookupError) throw new ApiError("validation_failed", vendorLookupError.message);

  let vendorId = existingVendor?.id as string | undefined;
  if (!vendorId) {
    const { data: created, error: createError } = await supabase
      .from("vendors")
      .insert({ agency_id: agencyId, property_id: propertyId })
      .select("id")
      .single();
    if (createError) throw new ApiError("validation_failed", createError.message);
    vendorId = created.id;
  }

  const { error: linkError } = await supabase
    .from("vendor_contacts")
    .upsert(
      { agency_id: agencyId, vendor_id: vendorId, contact_id: contactId },
      { onConflict: "vendor_id,contact_id", ignoreDuplicates: true }
    );
  if (linkError) throw new ApiError("validation_failed", linkError.message);
}

export async function getPropertyByRef(
  supabase: SupabaseClient,
  agencyId: string,
  ref: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No property with ref ${ref}`);
  return data;
}

// Every contact holding this number, matched in the database by the rules in
// lib/api/phone.ts (migration 0049). One place for the rule, so /contacts and
// everything keyed off a caller's number agree about who owns it.
export async function findContactsByPhone(
  supabase: SupabaseClient,
  agencyId: string,
  phone: string
) {
  const { data, error } = await supabase
    .rpc("contacts_by_phone", { p_agency_id: agencyId, p_phone: phone })
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new ApiError("validation_failed", error.message);
  return data ?? [];
}

// Used by the list endpoints that filter by a caller's number (viewings,
// offers, valuations, maintenance), which each want a single contact.
//
// Two behaviours changed here, both fixing bugs rather than altering a
// contract. It used to compare the raw string, so GET /viewings?phone=
// found nothing for a number GET /contacts?phone= found fine. And it used
// maybeSingle(), which errors outright when two contacts share a number —
// which this dataset deliberately contains. Oldest match wins, so repeated
// calls are stable.
export async function getContactByPhone(
  supabase: SupabaseClient,
  agencyId: string,
  phone: string
) {
  const matches = await findContactsByPhone(supabase, agencyId, phone);
  return matches[0] ?? null;
}

export async function requireContactById(
  supabase: SupabaseClient,
  agencyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No contact with id ${id}`);
  return data;
}
