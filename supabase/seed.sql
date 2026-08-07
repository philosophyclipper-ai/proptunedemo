-- PropTune Demo CRM — seed data
-- Deliberately messy: unparseable viewing_notes, nulls where a real agency
-- would have gaps (home_report_url, council_tax_band), a valuation with no
-- property yet, and a note-of-interest sitting next to a full offer on the
-- same property.

insert into agencies (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'PropTune Demo Estate Agents');

insert into users (id, agency_id, name, email, role) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Fiona Cameron', 'fiona@proptune-demo.co.uk', 'negotiator'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Ross Hendry', 'ross@proptune-demo.co.uk', 'negotiator');

insert into contacts (id, agency_id, name, roles, phone_primary, phone_secondary, email) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Morag Sinclair', array['vendor'], '+441315550101', null, 'morag.sinclair@example.com'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Callum Wallace', array['buyer'], '+447700900202', null, 'callum.wallace@example.com'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Aisha Farooq', array['buyer','applicant'], '+447700900303', '+441315550303', null),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'David Muir', array['landlord'], '+441414550404', null, 'david.muir@example.com'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Priya Chatterjee', array['tenant'], '+447700900505', null, 'priya.c@example.com'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Grant & Fiona Ross Solicitors', array['solicitor'], '+441315550606', null, 'conveyancing@grantfionaross.co.uk'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Elaine Dobson', array['vendor','landlord'], '+441315550707', null, null),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Kenny Boyle', array['buyer'], '+447700900808', null, 'kenny.boyle@example.com');

insert into properties (
  id, agency_id, ref, address_line1, address_line2, city, postcode, bedrooms,
  property_type, tenure, status, price_qualifier, asking_price, home_report_value,
  home_report_url, council_tax_band, epc_rating, vendor_contact_id,
  viewing_conducted_by, viewing_calendar_id, viewing_notes, closing_date
) values
  (
    '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'EH12345', '14 Rose Street', null, 'Edinburgh', 'EH2 2PR', 2,
    'flat', 'feuhold', 'available', 'offers_over', 245000, 240000,
    'https://storage.example.com/reports/eh12345.pdf', 'D', 'C',
    '10000000-0000-0000-0000-000000000001',
    'vendor', null,
    'Owner works shifts, evenings after 6 usually fine, never Sundays. Dog in the flat below barks if you buzz twice - just wait. Owner sometimes forgets and needs a reminder call.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'EH23456', '2 Dean Village Court', 'Flat 3', 'Edinburgh', 'EH4 3BS', 3,
    'flat', 'feuhold', 'under_offer', 'offers_over', 425000, 410000,
    null, null, 'B',
    '10000000-0000-0000-0000-000000000007',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Keys held at office, no restrictions.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'G34567', '9 Byres Road', null, 'Glasgow', 'G12 8SQ', 1,
    'flat', 'leasehold', 'available', 'fixed_price', 165000, null,
    'https://storage.example.com/reports/g34567.pdf', 'C', null,
    '10000000-0000-0000-0000-000000000001',
    'viewing_agent', 'proptune-demo-calendar@group.calendar.google.com',
    'Local viewing agent (Marchetti Lettings) covers this one - book through the shared calendar.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'EH45678', '71 Morningside Road', null, 'Edinburgh', 'EH10 4AZ', 4,
    'house', 'feuhold', 'available', 'offers_around', 620000, 605000,
    null, 'F', 'D',
    '10000000-0000-0000-0000-000000000007',
    'vendor', null,
    'Vendor still living there w/ 2 kids + big dog (friendly but LOUD). NOT before 9am or during school run 8:15-8:45. Weekends better. Call her mobile not landline, she never answers landline.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
    'EH56789', '3 Leith Walk', 'Top Floor', 'Edinburgh', 'EH6 8LN', 2,
    'flat', 'feuhold', 'sold', 'offers_over', 210000, 210000,
    'https://storage.example.com/reports/eh56789.pdf', 'C', 'D',
    '10000000-0000-0000-0000-000000000001',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Vacant, lockbox code 4471.',
    '2026-06-12'
  ),
  (
    '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
    'G45678', '18 Great Western Road', null, 'Glasgow', 'G4 9AH', null,
    'land', 'feuhold', 'available', 'poa', null, null,
    null, null, null,
    '10000000-0000-0000-0000-000000000001',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Building plot, access via side lane only - satnav sends people to the wrong gate.',
    null
  );

insert into property_photos (agency_id, property_id, url, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://storage.example.com/photos/eh12345-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://storage.example.com/photos/eh12345-2.jpg', 1),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'https://storage.example.com/photos/eh23456-1.jpg', 0);

-- Valuation with no property yet — pre-instruction, so it carries its own address.
insert into valuations (id, agency_id, property_id, contact_id, address_line1, city, postcode, estimated_value, status, valuation_date, notes) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', null, '10000000-0000-0000-0000-000000000004', '55 Comiston Road', 'Edinburgh', 'EH10 6AH', null, 'requested', null, null),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '3 Leith Walk', 'Edinburgh', 'EH6 8LN', 210000, 'completed', '2026-05-02', 'Valued ahead of sale, matched final asking price.');

-- Vendor-led viewing: requested, waiting on the vendor's own calendar.
insert into viewings (id, agency_id, property_id, contact_id, status, proposed_times) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'requested', array['2026-08-14T18:30:00Z','2026-08-15T17:00:00Z']);

-- Agent-led viewing: committed straight to a calendar slot.
insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at, calendar_event_id) values
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'confirmed', '2026-08-12T14:00:00Z', 'demo-cal-event-9182');

insert into tasks (id, agency_id, entity_type, entity_id, assignee_user_id, title, body, status) values
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Confirm viewing time with vendor for EH12345', 'Proposed times: 2026-08-14T18:30:00Z, 2026-08-15T17:00:00Z', 'open');

-- Note of interest and a full offer sitting on the same property.
insert into offers (id, agency_id, property_id, contact_id, type, amount, status, received_via) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'note_of_interest', null, 'open', 'ai_voice'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 'offer', 430000, 'accepted', 'phone');

update offers set solicitor_contact_id = '10000000-0000-0000-0000-000000000006'
  where id = '60000000-0000-0000-0000-000000000002';

insert into maintenance_issues (id, agency_id, property_id, contact_id, description, status, urgency) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Boiler losing pressure overnight, no hot water by morning.', 'reported', 'high');

insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body) values
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000002', 'ai', null, 'AI · Tue 4:12pm — Booked viewing at 14 Rose Street, Thursday 2pm. Cash buyer, no chain, sold subject to missives.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000003', 'ai', null, 'AI · Mon 11:05am — Registered interest in 14 Rose Street on behalf of caller. No amount discussed, wants to view first.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000008', 'user', '00000000-0000-0000-0000-0000000000a2', 'Called to confirm offer accepted on 2 Dean Village Court. Solicitor details taken, chasing mortgage in principle.'),
  ('00000000-0000-0000-0000-000000000001', 'property', '20000000-0000-0000-0000-000000000004', 'user', '00000000-0000-0000-0000-0000000000a1', 'Vendor called - wants us to hold off on new viewings until after half term, kids exams.'),
  ('00000000-0000-0000-0000-000000000001', 'maintenance_issue', '70000000-0000-0000-0000-000000000001', 'ai', null, 'AI · Wed 9:40am — Logged boiler pressure issue at 9 Byres Road, tenant home all week, flagged as high urgency.');
