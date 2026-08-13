// Flat, one-level, voice-safe shapes. agency_id is dropped everywhere —
// there's one agency, so it's noise the agent would never say aloud.
// Properties are always referenced by ref, never by their internal id —
// callers that embedded `properties(ref)` in their select get it read here.

type Row = Record<string, unknown>;

function propertyRef(row: Row): string | null {
  const embedded = row.properties as { ref: string } | null;
  return embedded?.ref ?? null;
}

function photoUrls(row: Row): string[] {
  const embedded = row.property_photos as { url: string; sort_order: number }[] | undefined;
  if (!embedded) return [];
  return [...embedded].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.url);
}

function additionalContacts(row: Row) {
  const embedded = row.offer_contacts as
    | { contacts: { id: string; name: string; phone_primary: string } | null }[]
    | undefined;
  if (!embedded) return [];
  return embedded.map((oc) => oc.contacts).filter((c): c is NonNullable<typeof c> => c != null);
}

export function toContact(row: Row) {
  return {
    id: row.id,
    name: row.name,
    roles: row.roles,
    phone_primary: row.phone_primary,
    phone_secondary: row.phone_secondary,
    email: row.email,
    company: row.company,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toProperty(row: Row) {
  return {
    ref: row.ref,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    city: row.city,
    postcode: row.postcode,
    bedrooms: row.bedrooms,
    property_type: row.property_type,
    tenure: row.tenure,
    status: row.status,
    listing_type: row.listing_type,
    price_qualifier: row.price_qualifier,
    asking_price: row.asking_price,
    home_report_value: row.home_report_value,
    home_report_url: row.home_report_url,
    rent_amount: row.rent_amount,
    rent_frequency: row.rent_frequency,
    council_tax_band: row.council_tax_band,
    epc_rating: row.epc_rating,
    vendor_contact_id: row.vendor_contact_id,
    viewing_conducted_by: row.viewing_conducted_by,
    closing_date: row.closing_date,
    went_live_at: row.went_live_at,
    negotiator_id: row.negotiator_id,
    photos: photoUrls(row),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toValuation(row: Row) {
  return {
    id: row.id,
    property_ref: propertyRef(row),
    contact_id: row.contact_id,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    city: row.city,
    postcode: row.postcode,
    estimated_value: row.estimated_value,
    status: row.status,
    valuation_date: row.valuation_date,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toViewing(row: Row) {
  return {
    id: row.id,
    property_ref: propertyRef(row),
    contact_id: row.contact_id,
    status: row.status,
    proposed_times: row.proposed_times,
    scheduled_at: row.scheduled_at,
    calendar_event_id: row.calendar_event_id,
    mortgage_status: row.mortgage_status,
    buyer_property_status: row.buyer_property_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toOffer(row: Row) {
  return {
    id: row.id,
    property_ref: propertyRef(row),
    contact_id: row.contact_id,
    additional_contacts: additionalContacts(row),
    type: row.type,
    amount: row.amount,
    status: row.status,
    solicitor_contact_id: row.solicitor_contact_id,
    received_via: row.received_via,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toMaintenanceIssue(row: Row) {
  return {
    id: row.id,
    property_ref: propertyRef(row),
    contact_id: row.contact_id,
    description: row.description,
    status: row.status,
    urgency: row.urgency,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toNote(row: Row) {
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    author_type: row.author_type,
    author_user_id: row.author_user_id,
    body: row.body,
    created_at: row.created_at,
  };
}

export function toTask(row: Row) {
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    assignee_user_id: row.assignee_user_id,
    title: row.title,
    body: row.body,
    status: row.status,
    due_at: row.due_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toUser(row: Row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export function toTimelineEntry(row: Row) {
  return {
    id: row.id,
    kind: row.kind,
    contact_id: row.contact_id,
    author_type: row.author_type,
    summary: row.summary,
    occurred_at: row.occurred_at,
  };
}
