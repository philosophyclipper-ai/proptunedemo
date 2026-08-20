"use server";

import { getAllProperties, getContacts, getOffers, getViewings } from "@/lib/ui/api-client";
import { titleCase } from "@/lib/ui/format";
import type { Contact } from "@/lib/ui/types";

export type ContactSearchResult = {
  contact: Contact;
  relationshipLabel: string | null;
  propertyRef: string | null;
  propertyAddress: string | null;
};

const RESULT_LIMIT = 8;

// Top-level contact search — name, email or a partial phone number, with
// the contact's most relevant property relationship resolved alongside it
// (ownership first, then their most recent offer or viewing) so the
// preview reads like "Vendor: 14/2 Rose Street" rather than just a name.
export async function searchContacts(query: string): Promise<ContactSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [{ contacts }, properties, { viewings }, { offers }] = await Promise.all([
    getContacts({ q: trimmed }),
    getAllProperties(),
    getViewings(),
    getOffers(),
  ]);

  const propertyByVendorId = new Map(
    properties.filter((p) => p.vendor_contact_id).map((p) => [p.vendor_contact_id as string, p])
  );
  const propertyByRef = new Map(properties.map((p) => [p.ref, p]));

  const byRecency = (a: { created_at: string }, b: { created_at: string }) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  return contacts.slice(0, RESULT_LIMIT).map((contact) => {
    const owned = propertyByVendorId.get(contact.id);
    if (owned) {
      return {
        contact,
        relationshipLabel: owned.listing_type === "lettings" ? "Landlord" : "Vendor",
        propertyRef: owned.ref,
        propertyAddress: owned.address_line1,
      };
    }

    const latestOffer = offers
      .filter((o) => o.contact_id === contact.id && o.property_ref)
      .sort(byRecency)[0];
    if (latestOffer) {
      const property = propertyByRef.get(latestOffer.property_ref as string);
      return {
        contact,
        relationshipLabel: property?.listing_type === "lettings" ? "Applicant" : "Buyer",
        propertyRef: latestOffer.property_ref,
        propertyAddress: property?.address_line1 ?? null,
      };
    }

    const latestViewing = viewings
      .filter((v) => v.contact_id === contact.id && v.property_ref)
      .sort(byRecency)[0];
    if (latestViewing) {
      const property = propertyByRef.get(latestViewing.property_ref as string);
      return {
        contact,
        relationshipLabel: property?.listing_type === "lettings" ? "Applicant" : "Buyer",
        propertyRef: latestViewing.property_ref,
        propertyAddress: property?.address_line1 ?? null,
      };
    }

    return {
      contact,
      relationshipLabel: contact.roles[0] ? titleCase(contact.roles[0]) : null,
      propertyRef: null,
      propertyAddress: null,
    };
  });
}
