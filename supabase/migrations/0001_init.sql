-- PropTune Demo CRM — initial schema
-- Every domain table carries agency_id even though there is only one agency.
-- RLS is enabled with no policies: all access goes through the Next.js API
-- routes using the service role key, never a client-side Supabase key.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- agencies
-- ---------------------------------------------------------------------------

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- users (agency staff — negotiators, admins; not the API's callers)
-- ---------------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  name text not null,
  email text not null,
  role text not null default 'negotiator',
  created_at timestamptz not null default now()
);

create index users_agency_id_idx on users(agency_id);

-- ---------------------------------------------------------------------------
-- contacts — one table, not four. roles is a bag of hats.
-- ---------------------------------------------------------------------------

create table contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  name text not null,
  roles text[] not null default '{}',
  phone_primary text not null,
  phone_secondary text,
  email text,
  notes_summary text, -- short freeform blurb from CRM UI, not the notes timeline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_roles_check check (
    roles <@ array['vendor','landlord','buyer','tenant','applicant','solicitor']::text[]
  )
);

create index contacts_agency_id_idx on contacts(agency_id);
create unique index contacts_agency_phone_primary_idx on contacts(agency_id, phone_primary);
create index contacts_name_trgm_idx on contacts using gin (to_tsvector('english', name));

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  ref text not null, -- public identifier, e.g. EH12345. Never expose the uuid.
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text not null,
  bedrooms int,
  property_type text, -- flat | house | bungalow | cottage | land ...
  tenure text, -- freehold | leasehold | feuhold
  status text not null default 'available', -- available | under_offer | sold | withdrawn
  price_qualifier text, -- offers_over | fixed_price | offers_around | offers_in_region_of | poa
  asking_price numeric,
  home_report_value numeric,
  home_report_url text,
  council_tax_band text,
  epc_rating text,
  vendor_contact_id uuid references contacts(id),
  viewing_conducted_by text not null default 'agency_staff', -- vendor | viewing_agent | agency_staff
  viewing_calendar_id text, -- Google Calendar id, used when agent-led
  viewing_notes text, -- free text, unparseable by design
  closing_date timestamptz, -- set by humans only, never by an agent
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_viewing_conducted_by_check check (
    viewing_conducted_by in ('vendor', 'viewing_agent', 'agency_staff')
  ),
  constraint properties_price_qualifier_check check (
    price_qualifier is null or price_qualifier in
      ('offers_over', 'fixed_price', 'offers_around', 'offers_in_region_of', 'poa')
  )
);

create index properties_agency_id_idx on properties(agency_id);
create unique index properties_agency_ref_idx on properties(agency_id, ref);
create index properties_postcode_idx on properties(postcode);
create index properties_status_idx on properties(status);

-- ---------------------------------------------------------------------------
-- property_photos
-- ---------------------------------------------------------------------------

create table property_photos (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index property_photos_property_id_idx on property_photos(property_id);

-- ---------------------------------------------------------------------------
-- valuations — may predate any property, so they carry their own address.
-- ---------------------------------------------------------------------------

create table valuations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid references properties(id),
  contact_id uuid not null references contacts(id),
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text not null,
  estimated_value numeric,
  status text not null default 'requested', -- requested | booked | completed | cancelled
  valuation_date timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index valuations_agency_id_idx on valuations(agency_id);
create index valuations_contact_id_idx on valuations(contact_id);
create index valuations_property_id_idx on valuations(property_id);

-- ---------------------------------------------------------------------------
-- viewings
-- ---------------------------------------------------------------------------

create table viewings (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id),
  contact_id uuid not null references contacts(id),
  status text not null default 'requested', -- requested | confirmed | cancelled | completed
  proposed_times text[], -- vendor-led: free-text/ISO slots proposed to the vendor
  scheduled_at timestamptz, -- agent-led: the committed slot
  calendar_event_id text, -- Google Calendar event id, agent-led only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint viewings_status_check check (
    status in ('requested', 'confirmed', 'cancelled', 'completed')
  )
);

create index viewings_agency_id_idx on viewings(agency_id);
create index viewings_property_id_idx on viewings(property_id);
create index viewings_contact_id_idx on viewings(contact_id);

-- ---------------------------------------------------------------------------
-- offers — covers both notes of interest and firm offers.
-- ---------------------------------------------------------------------------

create table offers (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id),
  contact_id uuid not null references contacts(id),
  type text not null, -- note_of_interest | offer
  amount numeric, -- null for note_of_interest, required for offer
  status text not null default 'open', -- open | accepted | rejected | countered | withdrawn
  solicitor_contact_id uuid references contacts(id),
  received_via text, -- ai_voice | phone | email | in_person | portal
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_type_check check (type in ('note_of_interest', 'offer')),
  constraint offers_amount_check check (
    (type = 'note_of_interest' and amount is null) or
    (type = 'offer' and amount is not null)
  )
);

create index offers_agency_id_idx on offers(agency_id);
create index offers_property_id_idx on offers(property_id);
create index offers_contact_id_idx on offers(contact_id);

-- ---------------------------------------------------------------------------
-- maintenance_issues
-- ---------------------------------------------------------------------------

create table maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  property_id uuid not null references properties(id),
  contact_id uuid references contacts(id), -- tenant/reporter, if known
  description text not null,
  status text not null default 'reported', -- reported | in_progress | resolved
  urgency text, -- low | normal | high | emergency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_issues_agency_id_idx on maintenance_issues(agency_id);
create index maintenance_issues_property_id_idx on maintenance_issues(property_id);

-- ---------------------------------------------------------------------------
-- notes — polymorphic, the system's memory. Read by humans, never parsed.
-- ---------------------------------------------------------------------------

create table notes (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  entity_type text not null, -- contact | property | viewing | offer | valuation | maintenance_issue
  entity_id uuid not null,
  author_type text not null, -- user | ai
  author_user_id uuid references users(id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint notes_author_type_check check (author_type in ('user', 'ai'))
);

create index notes_agency_id_idx on notes(agency_id);
create index notes_entity_idx on notes(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- tasks — the escape hatch for anything an agent can't complete.
-- ---------------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  entity_type text,
  entity_id uuid,
  assignee_user_id uuid references users(id),
  title text not null,
  body text,
  status text not null default 'open', -- open | done
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('open', 'done'))
);

create index tasks_agency_id_idx on tasks(agency_id);
create index tasks_assignee_idx on tasks(assignee_user_id);
create index tasks_entity_idx on tasks(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- timeline — a view, never written to, never queried by a voice agent.
-- Union of notes, viewings, valuations, offers, tasks, maintenance issues,
-- each resolved down to a contact and/or property so the UI can filter by
-- either.
-- ---------------------------------------------------------------------------

create view timeline as
  select
    n.id, n.agency_id, 'note'::text as kind, n.entity_type as subject_type,
    n.entity_id as subject_id,
    case when n.entity_type = 'contact' then n.entity_id end as contact_id,
    case when n.entity_type = 'property' then n.entity_id end as property_id,
    n.body as summary, n.created_at as occurred_at
  from notes n

  union all

  select
    v.id, v.agency_id, 'viewing', 'viewing', v.id,
    v.contact_id, v.property_id,
    'Viewing ' || v.status, v.created_at
  from viewings v

  union all

  select
    val.id, val.agency_id, 'valuation', 'valuation', val.id,
    val.contact_id, val.property_id,
    'Valuation ' || val.status, val.created_at
  from valuations val

  union all

  select
    o.id, o.agency_id, 'offer', 'offer', o.id,
    o.contact_id, o.property_id,
    case when o.type = 'offer' then 'Offer ' || o.status else 'Note of interest' end,
    o.created_at
  from offers o

  union all

  select
    t.id, t.agency_id, 'task', t.entity_type, t.entity_id,
    case when t.entity_type = 'contact' then t.entity_id end,
    case when t.entity_type = 'property' then t.entity_id end,
    t.title, t.created_at
  from tasks t

  union all

  select
    m.id, m.agency_id, 'maintenance_issue', 'maintenance_issue', m.id,
    m.contact_id, m.property_id,
    m.description, m.created_at
  from maintenance_issues m;

-- ---------------------------------------------------------------------------
-- idempotency store — implementation plumbing for the "Idempotency-Key on
-- every write" rule. Not a domain table, not exposed via any endpoint.
-- ---------------------------------------------------------------------------

create table api_idempotency_keys (
  agency_id uuid not null references agencies(id),
  route text not null,
  idempotency_key text not null,
  response_status int not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  primary key (agency_id, route, idempotency_key)
);

-- ---------------------------------------------------------------------------
-- RLS: on, no policies. Only the service role (used exclusively by the
-- Next.js API routes) can read or write.
-- ---------------------------------------------------------------------------

alter table agencies enable row level security;
alter table users enable row level security;
alter table contacts enable row level security;
alter table properties enable row level security;
alter table property_photos enable row level security;
alter table valuations enable row level security;
alter table viewings enable row level security;
alter table offers enable row level security;
alter table maintenance_issues enable row level security;
alter table notes enable row level security;
alter table tasks enable row level security;
alter table api_idempotency_keys enable row level security;

-- updated_at maintenance
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_set_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();
create trigger valuations_set_updated_at before update on valuations
  for each row execute function set_updated_at();
create trigger viewings_set_updated_at before update on viewings
  for each row execute function set_updated_at();
create trigger offers_set_updated_at before update on offers
  for each row execute function set_updated_at();
create trigger maintenance_issues_set_updated_at before update on maintenance_issues
  for each row execute function set_updated_at();
create trigger tasks_set_updated_at before update on tasks
  for each row execute function set_updated_at();
