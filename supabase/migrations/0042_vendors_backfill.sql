-- Backfill vendors/vendor_contacts from the two old shapes.

-- One vendors row per property that has a vendor via either old shape.
insert into vendors (agency_id, property_id)
select p.agency_id, p.id
from properties p
where p.vendor_contact_id is not null
   or exists (
     select 1 from property_contacts pc
     where pc.property_id = p.id and pc.role = 'vendor'
   );

-- vendor_contacts from vendor_contact_id.
insert into vendor_contacts (agency_id, vendor_id, contact_id)
select p.agency_id, v.id, p.vendor_contact_id
from properties p
join vendors v on v.property_id = p.id
where p.vendor_contact_id is not null
on conflict (vendor_id, contact_id) do nothing;

-- vendor_contacts from property_contacts rows with role = 'vendor'. Other
-- roles (buyer, solicitor) are untouched and stay in property_contacts.
insert into vendor_contacts (agency_id, vendor_id, contact_id)
select pc.agency_id, v.id, pc.contact_id
from property_contacts pc
join vendors v on v.property_id = pc.property_id
where pc.role = 'vendor'
on conflict (vendor_id, contact_id) do nothing;

-- Defensive: backfill vendor_contact_id for any property that ended up
-- with a vendors record but no vendor_contact_id (not the case for any
-- property today, since every current vendor originated from a non-null
-- vendor_contact_id — but keeps "populated from the first contact on the
-- vendor record" true in general, not just for today's data).
update properties p
set vendor_contact_id = (
  select vc.contact_id
  from vendor_contacts vc
  join vendors v on v.id = vc.vendor_id
  where v.property_id = p.id
  order by vc.created_at asc
  limit 1
)
where p.vendor_contact_id is null
  and exists (select 1 from vendors v where v.property_id = p.id);
