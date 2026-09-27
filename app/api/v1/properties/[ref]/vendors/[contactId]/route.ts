import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPropertyByRef } from "@/lib/api/lookups";

// UI only. Detaches one contact from the property's vendor record. The
// contact itself is untouched — they may be a buyer on another property, and
// "no longer the seller of this one" is not "delete this person".
//
// Idempotent: detaching a contact who isn't attached reports the same result
// rather than failing.
export const DELETE = withErrorHandling(async (request, { params }) => {
  const { ref, contactId } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (vendorError) throw new ApiError("validation_failed", vendorError.message);

  if (vendor) {
    const { error } = await supabase
      .from("vendor_contacts")
      .delete()
      .eq("vendor_id", vendor.id)
      .eq("contact_id", contactId);
    if (error) throw new ApiError("validation_failed", error.message);
  }

  // properties.vendor_contact_id is a mirror of "the first contact on the
  // vendor record" (migration 0042). If the contact just removed was the one
  // being mirrored, repoint it at whoever remains rather than leaving it
  // naming someone who is no longer a vendor.
  if (property.vendor_contact_id === contactId) {
    const { data: remaining, error: remainingError } = await supabase
      .from("vendor_contacts")
      .select("contact_id, created_at")
      .eq("vendor_id", vendor?.id ?? "")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (remainingError) throw new ApiError("validation_failed", remainingError.message);

    const { error } = await supabase
      .from("properties")
      .update({ vendor_contact_id: remaining?.contact_id ?? null })
      .eq("agency_id", agencyId)
      .eq("id", property.id);
    if (error) throw new ApiError("validation_failed", error.message);
  }

  return NextResponse.json({ removed: true, property_ref: ref, contact_id: contactId });
});
