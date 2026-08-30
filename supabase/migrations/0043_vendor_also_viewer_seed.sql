-- Neil Sinclair is already a joint vendor on EH45678 (property_contacts,
-- migrated into vendor_contacts by 0042). Gives him a live viewing on a
-- different property too, so GET /contacts/{id}?embed=vendors,viewings
-- has a real case of one contact being both at once.

insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at) values
  ('50000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000023',
   'confirmed', '2026-09-15T11:00:00Z');
