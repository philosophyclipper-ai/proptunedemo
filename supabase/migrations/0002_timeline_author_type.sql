-- Add author_type to the timeline view so the CRM UI can visually
-- distinguish AI-authored notes from staff notes in a contact's feed.
-- Only notes carry an author_type; every other kind reports null.

create or replace view timeline as
  select
    n.id, n.agency_id, 'note'::text as kind, n.entity_type as subject_type,
    n.entity_id as subject_id,
    case when n.entity_type = 'contact' then n.entity_id end as contact_id,
    case when n.entity_type = 'property' then n.entity_id end as property_id,
    n.body as summary, n.created_at as occurred_at,
    n.author_type
  from notes n

  union all

  select
    v.id, v.agency_id, 'viewing', 'viewing', v.id,
    v.contact_id, v.property_id,
    'Viewing ' || v.status, v.created_at,
    null::text
  from viewings v

  union all

  select
    val.id, val.agency_id, 'valuation', 'valuation', val.id,
    val.contact_id, val.property_id,
    'Valuation ' || val.status, val.created_at,
    null::text
  from valuations val

  union all

  select
    o.id, o.agency_id, 'offer', 'offer', o.id,
    o.contact_id, o.property_id,
    case when o.type = 'offer' then 'Offer ' || o.status else 'Note of interest' end,
    o.created_at,
    null::text
  from offers o

  union all

  select
    t.id, t.agency_id, 'task', t.entity_type, t.entity_id,
    case when t.entity_type = 'contact' then t.entity_id end,
    case when t.entity_type = 'property' then t.entity_id end,
    t.title, t.created_at,
    null::text
  from tasks t

  union all

  select
    m.id, m.agency_id, 'maintenance_issue', 'maintenance_issue', m.id,
    m.contact_id, m.property_id,
    m.description, m.created_at,
    null::text
  from maintenance_issues m;
