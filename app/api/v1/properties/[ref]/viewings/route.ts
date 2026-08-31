import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPropertyByRef } from "@/lib/api/lookups";
import { formatEmbeddedAddress } from "@/lib/api/embed";

function splitName(name: string): { first_name: string; last_name: string | null } {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first_name: first, last_name: rest.length > 0 ? rest.join(" ") : null };
}

// getPropertyByRef throws not_found (-> 404 JSON via withErrorHandling) for
// an unknown ref, same as every other :ref-addressed route.
export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const property = await getPropertyByRef(supabase, agencyId, ref);
  const propertyAddress = [formatEmbeddedAddress(property), property.postcode as string]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await supabase
    .from("viewings")
    .select("id, status, scheduled_at, contacts(name, phone_primary)")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .order("scheduled_at", { ascending: false });

  if (error) throw new ApiError("validation_failed", error.message);

  const viewings = (data ?? []).map((row) => {
    const contact = row.contacts as unknown as { name: string; phone_primary: string } | null;
    const { first_name, last_name } = contact
      ? splitName(contact.name)
      : { first_name: null, last_name: null };

    return {
      viewing_id: row.id,
      status: row.status,
      scheduled_at: row.scheduled_at,
      buyer_first_name: first_name,
      buyer_last_name: last_name,
      buyer_phone: contact?.phone_primary ?? null,
      property_address: propertyAddress,
    };
  });

  return NextResponse.json({ viewings });
});
