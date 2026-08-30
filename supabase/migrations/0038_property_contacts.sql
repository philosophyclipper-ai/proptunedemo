-- Additive per-property contact link, carrying a role. Does NOT replace
-- properties.vendor_contact_id — that stays exactly as-is, still the
-- primary/first vendor. This table only covers what a single FK can't:
-- a second contact on the same property (a joint owner, most commonly).
-- Both are equally authoritative for "is this contact the seller of this
-- property" — a caller must check both, not just one.
--
-- property_id (not property_ref) to match every other child table in this
-- schema (viewings, offers, maintenance_issues, valuations, property_photos
-- all key off property_id) — ref stays purely an API-layer identifier,
-- resolved to id server-side same as everywhere else.

create table property_contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id),
  contact_id uuid not null references contacts(id),
  role text not null, -- vendor | buyer | solicitor
  created_at timestamptz not null default now(),
  constraint property_contacts_role_check check (role in ('vendor', 'buyer', 'solicitor')),
  constraint property_contacts_unique unique (property_id, contact_id, role)
);

create index property_contacts_agency_id_idx on property_contacts(agency_id);
create index property_contacts_property_id_idx on property_contacts(property_id);
create index property_contacts_contact_id_idx on property_contacts(contact_id);

alter table property_contacts enable row level security;
