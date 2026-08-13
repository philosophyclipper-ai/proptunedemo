-- The timeline view only resolved a note's contact_id/property_id when the
-- note was authored directly against a contact or property. Notes attached
-- to a viewing/offer/valuation/maintenance_issue (the common case — viewing
-- feedback, post-call summaries) never carried their contact through, so
-- they were invisible on the contact's timeline despite CLAUDE.md's own
-- example ("AI · Tue 4:12pm — Booked viewing..."). Also carries author_type
-- through so the AI/Staff pill on the timeline actually reflects reality
-- instead of always reading as Staff.

drop view timeline;

create view timeline as
  select
    n.id, n.agency_id, 'note'::text as kind, n.entity_type as subject_type,
    n.entity_id as subject_id,
    coalesce(
      case when n.entity_type = 'contact' then n.entity_id end,
      v.contact_id, o.contact_id, m.contact_id, val.contact_id
    ) as contact_id,
    coalesce(
      case when n.entity_type = 'property' then n.entity_id end,
      v.property_id, o.property_id, m.property_id, val.property_id
    ) as property_id,
    n.body as summary, n.created_at as occurred_at,
    n.author_type
  from notes n
  left join viewings v on n.entity_type = 'viewing' and v.id = n.entity_id
  left join offers o on n.entity_type = 'offer' and o.id = n.entity_id
  left join maintenance_issues m on n.entity_type = 'maintenance_issue' and m.id = n.entity_id
  left join valuations val on n.entity_type = 'valuation' and val.id = n.entity_id

  union all

  select
    v.id, v.agency_id, 'viewing', 'viewing', v.id,
    v.contact_id, v.property_id,
    'Viewing ' || v.status, v.created_at,
    null::text as author_type
  from viewings v

  union all

  select
    val.id, val.agency_id, 'valuation', 'valuation', val.id,
    val.contact_id, val.property_id,
    'Valuation ' || val.status, val.created_at,
    null::text as author_type
  from valuations val

  union all

  select
    o.id, o.agency_id, 'offer', 'offer', o.id,
    o.contact_id, o.property_id,
    case when o.type = 'offer' then 'Offer ' || o.status else 'Note of interest' end,
    o.created_at,
    null::text as author_type
  from offers o

  union all

  select
    t.id, t.agency_id, 'task', t.entity_type, t.entity_id,
    case when t.entity_type = 'contact' then t.entity_id end,
    case when t.entity_type = 'property' then t.entity_id end,
    t.title, t.created_at,
    null::text as author_type
  from tasks t

  union all

  select
    m.id, m.agency_id, 'maintenance_issue', 'maintenance_issue', m.id,
    m.contact_id, m.property_id,
    m.description, m.created_at,
    null::text as author_type
  from maintenance_issues m;
