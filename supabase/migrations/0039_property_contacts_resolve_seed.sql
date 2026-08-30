-- Seed data covering every branch of GET /api/v1/contacts/resolve on
-- EH45678 (vendor: Elaine Dobson, 10000000-...-0007) and EH23456 as the
-- "elsewhere" property:
--
--   Neil Sinclair    - co-vendor on EH45678 via property_contacts (role
--                      'vendor'), proving resolve treats this the same as
--                      vendor_contact_id.
--   Priya Mehta      - live 'confirmed' viewing on EH45678 -> buyer_with_viewing.
--                      Also the match_count:2 case: Robbie Wallace's
--                      phone_secondary equals Priya's phone_primary.
--   Douglas Kerr     - live viewing on EH23456, none on EH45678 -> buyer_other_property.
--   Isla Fraser      - no viewings anywhere, not a vendor -> known_unrelated.
--   Robbie Wallace   - shares Priya's number (see above), no property
--                      connection of his own -> proves resolve prefers the
--                      candidate actually tied to the property being asked
--                      about, not just whichever row sorts first.
--
-- David McTaggart (252e7103-664b-4380-940f-bb92cf868397, phone_primary
-- '07446659726', live UI test data seeded earlier) already covers "07...
-- stored format whose E.164 form resolves correctly" — no new row needed.

insert into contacts (id, agency_id, name, roles, phone_primary, phone_secondary) values
  ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001',
   'Neil Sinclair', array['vendor'], '+447700903001', null),
  ('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001',
   'Priya Mehta', array['buyer'], '+447700903002', null),
  ('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001',
   'Douglas Kerr', array['buyer'], '+447700903003', null),
  ('10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001',
   'Isla Fraser', array['applicant'], '+447700903004', null),
  ('10000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001',
   'Robbie Wallace', array['applicant'], '+447700903005', '+447700903002');

insert into property_contacts (agency_id, property_id, contact_id, role) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000023', 'vendor');

insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at) values
  ('50000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000024',
   'confirmed', '2026-09-10T14:00:00Z');

insert into viewings (id, agency_id, property_id, contact_id, status, proposed_times) values
  ('50000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000025',
   'requested', array['2026-09-11T10:00:00Z','2026-09-12T15:00:00Z']);
