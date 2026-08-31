import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";

const EMBED_CAP = 100;

export function parseEmbed(searchParams: URLSearchParams, allowed: string[]): string[] {
  const raw = searchParams.get("embed");
  if (!raw) return [];
  const requested = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid = requested.filter((e) => !allowed.includes(e));
  if (invalid.length > 0) {
    throw new ApiError(
      "bad_request",
      `Unsupported embed value(s): ${invalid.join(", ")}. Supported: ${allowed.join(", ")}`
    );
  }
  return requested;
}

// Embedded records never carry a contact's surname, email or full phone
// number — only a first name. The consumer may be a voice agent reading
// results aloud to whoever is holding the phone, who is not certainly the
// contact themselves.
export function toEmbeddedContact(row: { id: string; name: string; roles: string[] }) {
  return { contact_id: row.id, first_name: row.name.split(" ")[0], roles: row.roles };
}

// The single composition used everywhere an embedded record needs a
// display address — unit/flat (address_line2) leads, then the street
// (address_line1), matching how this CRM writes an address out for a
// person to read. One implementation so different embed types can't drift
// from each other. Missing/unresolvable property -> "", never null and
// never the ref as a fallback — a voice agent reads "" as "no address" and
// falls back to the ref itself, which it already has.
export function formatEmbeddedAddress(
  property: { address_line1: string; address_line2: string | null } | null | undefined
): string {
  if (!property) return "";
  return [property.address_line2, property.address_line1].filter(Boolean).join(", ");
}

function cap<T>(items: T[]): { items: T[]; truncated: boolean } {
  if (items.length <= EMBED_CAP) return { items, truncated: false };
  return { items: items.slice(0, EMBED_CAP), truncated: true };
}

// Adds `_embedded` (and `_embedded_truncated` when a cap was hit) to a
// serialized record, without touching any of its existing fields. Returns
// the record unchanged when there's nothing to embed, so a request with no
// `embed` param never differs from today's response.
export function withEmbed<T extends object>(
  base: T,
  entry: { embedded: Record<string, unknown[]>; truncated: boolean } | undefined
): T {
  if (!entry || Object.keys(entry.embedded).length === 0) return base;
  return {
    ...base,
    _embedded: entry.embedded,
    ...(entry.truncated ? { _embedded_truncated: true } : {}),
  };
}

type ContactEmbedEntry = { embedded: Record<string, unknown[]>; truncated: boolean };

// Bulk-resolves vendors/viewings/offers for a whole page of contacts in one
// query per embed type (not one query per contact) — the N+1 this
// parameter exists to avoid.
export async function attachContactEmbeds(
  supabase: SupabaseClient,
  agencyId: string,
  contacts: { id: string }[],
  embeds: string[]
): Promise<Map<string, ContactEmbedEntry>> {
  const result = new Map<string, ContactEmbedEntry>();
  const ids = contacts.map((c) => c.id);
  for (const c of contacts) result.set(c.id, { embedded: {}, truncated: false });
  if (ids.length === 0 || embeds.length === 0) return result;

  function record(contactId: string, key: string, items: unknown[]) {
    const { items: capped, truncated } = cap(items);
    const entry = result.get(contactId);
    if (!entry) return;
    entry.embedded[key] = capped;
    entry.truncated = entry.truncated || truncated;
  }

  if (embeds.includes("vendors")) {
    const { data, error } = await supabase
      .from("vendor_contacts")
      .select(
        "contact_id, vendors(id, properties(ref, address_line1, address_line2, postcode, status))"
      )
      .eq("agency_id", agencyId)
      .in("contact_id", ids);
    if (error) throw new ApiError("validation_failed", error.message);

    const byContact = new Map<string, unknown[]>();
    for (const row of data ?? []) {
      const v = row.vendors as unknown as {
        id: string;
        properties: {
          ref: string;
          address_line1: string;
          address_line2: string | null;
          postcode: string;
          status: string;
        } | null;
      } | null;
      if (!v) continue;
      const list = byContact.get(row.contact_id as string) ?? [];
      list.push({
        vendor_id: v.id,
        property_ref: v.properties?.ref ?? null,
        address: formatEmbeddedAddress(v.properties),
        postcode: v.properties?.postcode ?? "",
        status: v.properties?.status ?? null,
      });
      byContact.set(row.contact_id as string, list);
    }
    for (const [contactId, list] of byContact) record(contactId, "vendors", list);
  }

  if (embeds.includes("viewings")) {
    const { data, error } = await supabase
      .from("viewings")
      .select("id, contact_id, status, scheduled_at, properties(ref, address_line1, address_line2, postcode)")
      .eq("agency_id", agencyId)
      .in("contact_id", ids)
      .neq("status", "cancelled");
    if (error) throw new ApiError("validation_failed", error.message);

    const byContact = new Map<string, unknown[]>();
    for (const row of data ?? []) {
      const property = row.properties as unknown as {
        ref: string;
        address_line1: string;
        address_line2: string | null;
        postcode: string;
      } | null;
      const list = byContact.get(row.contact_id as string) ?? [];
      list.push({
        viewing_id: row.id,
        property_ref: property?.ref ?? null,
        address: formatEmbeddedAddress(property),
        postcode: property?.postcode ?? "",
        status: row.status,
        scheduled_at: row.scheduled_at,
      });
      byContact.set(row.contact_id as string, list);
    }
    for (const [contactId, list] of byContact) record(contactId, "viewings", list);
  }

  if (embeds.includes("offers")) {
    const { data, error } = await supabase
      .from("offers")
      .select("id, contact_id, type, status, amount, properties(ref)")
      .eq("agency_id", agencyId)
      .in("contact_id", ids);
    if (error) throw new ApiError("validation_failed", error.message);

    const byContact = new Map<string, unknown[]>();
    for (const row of data ?? []) {
      const list = byContact.get(row.contact_id as string) ?? [];
      list.push({
        offer_id: row.id,
        property_ref: (row.properties as unknown as { ref: string } | null)?.ref ?? null,
        type: row.type,
        status: row.status,
        amount: row.amount,
      });
      byContact.set(row.contact_id as string, list);
    }
    for (const [contactId, list] of byContact) record(contactId, "offers", list);
  }

  if (embeds.includes("property_contacts")) {
    const { data, error } = await supabase
      .from("property_contacts")
      .select("contact_id, role, properties(ref, address_line1, address_line2, postcode)")
      .eq("agency_id", agencyId)
      .in("contact_id", ids);
    if (error) throw new ApiError("validation_failed", error.message);

    const byContact = new Map<string, unknown[]>();
    for (const row of data ?? []) {
      const property = row.properties as unknown as {
        ref: string;
        address_line1: string;
        address_line2: string | null;
        postcode: string;
      } | null;
      const list = byContact.get(row.contact_id as string) ?? [];
      list.push({
        property_ref: property?.ref ?? null,
        role: row.role,
        address: formatEmbeddedAddress(property),
        postcode: property?.postcode ?? "",
      });
      byContact.set(row.contact_id as string, list);
    }
    for (const [contactId, list] of byContact) record(contactId, "property_contacts", list);
  }

  return result;
}

// The reverse direction: a property embedding the contacts on its vendor
// record. One query (two levels of embed) for the single property being
// requested — GET /properties/:ref is never a list, so there's no N+1 to
// avoid here, just the same additive/never-truncated-silently contract.
export async function attachPropertyVendorsEmbed(
  supabase: SupabaseClient,
  agencyId: string,
  propertyId: string
): Promise<{ embedded: Record<string, unknown[]>; truncated: boolean }> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, vendor_contacts(contacts(id, name, roles))")
    .eq("agency_id", agencyId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw new ApiError("validation_failed", error.message);

  const rows = (data?.vendor_contacts ?? []) as unknown as {
    contacts: { id: string; name: string; roles: string[] } | null;
  }[];
  const contacts = rows.map((r) => r.contacts).filter((c): c is NonNullable<typeof c> => c != null);
  const { items, truncated } = cap(contacts.map(toEmbeddedContact));
  return { embedded: { vendors: items }, truncated };
}
