import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { ensureVendorContact, getPropertyByRef } from "@/lib/api/lookups";

// UI only. properties.vendor_contact_id holds one contact and can't express
// joint ownership, which is exactly what vendors/vendor_contacts exists for
// (migration 0041). These routes are how a negotiator manages that list —
// a second owner on a couple's sale, or removing someone added by mistake.
//
// Addressed by ref like every other :ref route, so the property's uuid never
// leaves the server.

export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);

  const { data, error } = await supabase
    .from("vendors")
    .select("id, vendor_contacts(contact_id, created_at, contacts(id, name, phone_primary, email, company))")
    .eq("agency_id", agencyId)
    .eq("property_id", property.id)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);

  type ContactRow = {
    id: string;
    name: string;
    phone_primary: string;
    email: string | null;
    company: string | null;
  };

  // PostgREST types an embedded relation as an array even where the FK makes
  // it at most one row, so normalise both shapes rather than assuming either.
  const links = (data?.vendor_contacts ?? []) as unknown as {
    created_at: string;
    contacts: ContactRow | ContactRow[] | null;
  }[];

  const vendors = links
    .map((link) => ({
      created_at: link.created_at,
      contact: Array.isArray(link.contacts) ? (link.contacts[0] ?? null) : link.contacts,
    }))
    .filter((link): link is { created_at: string; contact: ContactRow } => link.contact != null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ contact }) => ({
      contact_id: contact.id,
      name: contact.name,
      phone: contact.phone_primary,
      email: contact.email,
      company: contact.company,
      // The one mirrored into properties.vendor_contact_id, which older n8n
      // workflows still read.
      is_primary: contact.id === property.vendor_contact_id,
    }));

  return NextResponse.json({ property_ref: ref, vendors });
});

export const POST = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const property = await getPropertyByRef(supabase, agencyId, ref);
  const body = await request.json();

  if (!body.contact_id) throw new ApiError("validation_failed", "contact_id is required");

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("id", body.contact_id)
    .maybeSingle();
  if (contactError) throw new ApiError("validation_failed", contactError.message);
  if (!contact) throw new ApiError("not_found", `No contact with id ${body.contact_id}`);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /properties/:ref/vendors",
    idempotencyKey,
    async () => {
      await ensureVendorContact(supabase, agencyId, property.id as string, contact.id as string);

      // Keep the legacy mirror truthful: if the property had no vendor at
      // all, the first one attached becomes the primary.
      if (!property.vendor_contact_id) {
        const { error } = await supabase
          .from("properties")
          .update({ vendor_contact_id: contact.id })
          .eq("agency_id", agencyId)
          .eq("id", property.id);
        if (error) throw new ApiError("validation_failed", error.message);
      }

      return { status: 201, body: { property_ref: ref, contact_id: contact.id } };
    }
  );

  return NextResponse.json(responseBody, { status });
});
