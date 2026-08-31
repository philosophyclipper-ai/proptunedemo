import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPropertyByRef } from "@/lib/api/lookups";
import { formatEmbeddedAddress } from "@/lib/api/embed";

// getPropertyByRef throws not_found (-> 404 JSON via withErrorHandling) for
// an unknown ref, same as every other :ref-addressed route.
//
// Returns contact_id, not buyer name/phone resolved inline — the buyer is
// a contact record, not data the viewing itself owns. A caller wanting the
// name/phone resolves it via GET /contacts/:id or the bulk
// GET /contacts?ids=a,b,c lookup.
export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const property = await getPropertyByRef(supabase, agencyId, ref);
  const propertyAddress = [formatEmbeddedAddress(property), property.postcode as string]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await supabase
    .from("viewings")
    .select("id, status, scheduled_at, contact_id")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .order("scheduled_at", { ascending: false });

  if (error) throw new ApiError("validation_failed", error.message);

  const viewings = (data ?? []).map((row) => ({
    viewing_id: row.id,
    status: row.status,
    scheduled_at: row.scheduled_at,
    contact_id: row.contact_id,
    property_address: propertyAddress,
  }));

  return NextResponse.json({ viewings });
});
