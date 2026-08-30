-- Vendor as its own entity (Reapit-style): one vendors row per property,
-- one or more contacts hanging off it via vendor_contacts. Joint owners
-- fall out naturally instead of needing a special case.
--
-- properties.vendor_contact_id is NOT replaced. n8n workflows read it from
-- toProperty() today and aren't being redeployed alongside this change —
-- it stays, stays in toProperty(), and gets backfilled (0042) from the
-- first contact on the vendor record so it stays truthful for the
-- single-owner case. vendors/vendor_contacts is authoritative; the column
-- is a read compatibility shim.
--
-- property_contacts (0038) is untouched — its non-vendor rows (buyer,
-- solicitor) are out of scope here and stay exactly where they are. Its
-- vendor-role rows get migrated into vendor_contacts in 0042; the table
-- itself is not dropped.

create table vendors (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id),
  created_at timestamptz not null default now(),
  constraint vendors_one_per_property unique (property_id)
);

create index vendors_agency_id_idx on vendors(agency_id);

-- agency_id + created_at aren't in the brief's column list but match every
-- other join table in this schema (offer_contacts, property_contacts) and
-- CLAUDE.md's "every table carries agency_id" rule.
create table vendor_contacts (
  agency_id uuid not null references agencies(id),
  vendor_id uuid not null references vendors(id) on delete cascade,
  contact_id uuid not null references contacts(id),
  created_at timestamptz not null default now(),
  primary key (vendor_id, contact_id)
);

create index vendor_contacts_contact_id_idx on vendor_contacts(contact_id);

alter table vendors enable row level security;
alter table vendor_contacts enable row level security;

comment on column properties.vendor_contact_id is
  'Legacy read compatibility column, kept so existing n8n workflows and toProperty() keep working unchanged. vendors/vendor_contacts are authoritative for property ownership — this column is backfilled from the first contact on the property''s vendor record and does not reflect joint owners. Do not write new logic against it; read vendors instead.';
