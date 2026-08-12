-- Offers/applications can carry more than one contact — a couple buying
-- together, multiple applicants on a tenancy. offers.contact_id stays as
-- the primary contact (unchanged, still what voice/n8n write to); this
-- table holds anyone additional, UI-managed only.

create table offer_contacts (
  agency_id uuid not null references agencies(id),
  offer_id uuid not null references offers(id) on delete cascade,
  contact_id uuid not null references contacts(id),
  created_at timestamptz not null default now(),
  primary key (offer_id, contact_id)
);

create index offer_contacts_offer_id_idx on offer_contacts(offer_id);

alter table offer_contacts enable row level security;
