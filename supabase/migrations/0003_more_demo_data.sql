-- Additive demo data — more properties, contacts, viewings (with post-viewing
-- feedback notes), offers, and maintenance issues, so the CRM UI has enough
-- volume to browse. This is data, not schema, but the live project was
-- already seeded via supabase/seed.sql, so a normal migration (applied once,
-- never re-run) is the safe way to layer more rows on top without touching
-- what's already there. seed.sql is left as the original bootstrap dataset.

insert into contacts (id, agency_id, name, roles, phone_primary, phone_secondary, email) values
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Hamish Reid', array['vendor'], '+447700900909', null, 'hamish.reid@example.com'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Lorna Bell', array['vendor','landlord'], '+447700901010', null, 'lorna.bell@example.com'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Fraser Grant', array['buyer'], '+447700901111', null, 'fraser.grant@example.com'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Sarah Jenkins', array['buyer','applicant'], '+447700901212', null, 'sarah.jenkins@example.com'),
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Tom Okafor', array['buyer'], '+447700901313', null, 'tom.okafor@example.com'),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Nadia Hussain', array['buyer','applicant'], '+447700901414', null, null),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Willie Thomson', array['vendor'], '+447700901515', null, null),
  ('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Connor Blake', array['buyer'], '+447700901616', null, 'connor.blake@example.com');

insert into properties (
  id, agency_id, ref, address_line1, address_line2, city, postcode, bedrooms,
  property_type, tenure, status, price_qualifier, asking_price, home_report_value,
  home_report_url, council_tax_band, epc_rating, vendor_contact_id,
  viewing_conducted_by, viewing_calendar_id, viewing_notes, closing_date
) values
  (
    '20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
    'EH67890', '22 Marchmont Crescent', null, 'Edinburgh', 'EH9 1HG', 3,
    'flat', 'feuhold', 'available', 'offers_over', 385000, 378000,
    'https://storage.example.com/reports/eh67890.pdf', 'E', 'C',
    '10000000-0000-0000-0000-000000000009',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Tenant moved out last month, now vacant - keys at office, no restrictions.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
    'EH78901', '5 Comely Bank Avenue', null, 'Edinburgh', 'EH4 1EP', 4,
    'house', 'feuhold', 'under_offer', 'offers_over', 550000, 540000,
    null, 'F', null,
    '10000000-0000-0000-0000-000000000010',
    'vendor', null,
    'Vendor works from home most days - avoid 9-11am, she is always on video calls then. Two cats, keep the front door shut tight or they bolt. Text first, she often misses calls.',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
    'G56789', '88 Sauchiehall Street', 'Flat 2/1', 'Glasgow', 'G2 3DH', 1,
    'flat', 'leasehold', 'available', 'fixed_price', 145000, null,
    'https://storage.example.com/reports/g56789.pdf', 'B', 'D',
    '10000000-0000-0000-0000-000000000015',
    'viewing_agent', 'proptune-demo-calendar@group.calendar.google.com',
    'City centre flat - viewing agent (Marchetti Lettings) handles all viewings via the shared calendar.',
    null
  ),
  (
    '20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001',
    'G67890', '14 Kelvingrove Street', null, 'Glasgow', 'G3 7RN', 2,
    'flat', 'leasehold', 'sold', 'offers_over', 205000, 205000,
    'https://storage.example.com/reports/g67890.pdf', 'C', 'C',
    '10000000-0000-0000-0000-000000000010',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Vacant, lockbox code 7729.',
    '2026-07-30'
  ),
  (
    '20000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001',
    'FK12345', '3 Ochil View', null, 'Stirling', 'FK8 2QY', 3,
    'house', 'feuhold', 'available', 'offers_over', 295000, 288000,
    null, 'E', 'D',
    '10000000-0000-0000-0000-000000000009',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Family home, vendor has already relocated so it is vacant - keys at office.',
    null
  ),
  (
    '20000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001',
    'AB12345', '19 Union Grove', null, 'Aberdeen', 'AB10 6SD', 2,
    'flat', 'leasehold', 'withdrawn', 'offers_over', 175000, 170000,
    null, 'D', null,
    '10000000-0000-0000-0000-000000000015',
    'vendor', null,
    'Vendor withdrew from market in July - keeping on file in case they relist.',
    null
  );

insert into property_photos (agency_id, property_id, url, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'https://storage.example.com/photos/eh67890-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'https://storage.example.com/photos/eh67890-2.jpg', 1),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'https://storage.example.com/photos/eh78901-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'https://storage.example.com/photos/g56789-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'https://storage.example.com/photos/g56789-2.jpg', 1),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'https://storage.example.com/photos/g67890-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'https://storage.example.com/photos/fk12345-1.jpg', 0),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'https://storage.example.com/photos/fk12345-2.jpg', 1);

-- Viewings: a mix of confirmed (agency-led), requested (vendor-led), a
-- cancellation, and three already-completed ones that carry feedback notes.

insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at, calendar_event_id) values
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011', 'confirmed', '2026-08-11T10:00:00Z', 'demo-cal-event-3301'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012', 'confirmed', '2026-08-13T15:30:00Z', 'demo-cal-event-3302'),
  ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000014', 'confirmed', '2026-08-14T13:00:00Z', 'demo-cal-event-3303'),
  ('50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000016', 'confirmed', '2026-08-12T09:30:00Z', 'demo-cal-event-3304'),
  ('50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'completed', '2026-08-05T18:30:00Z', 'demo-cal-event-3305'),
  ('50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'completed', '2026-08-06T16:00:00Z', 'demo-cal-event-3306'),
  ('50000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', 'completed', '2026-08-04T12:00:00Z', 'demo-cal-event-3307'),
  ('50000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'cancelled', '2026-08-09T10:00:00Z', null);

insert into viewings (id, agency_id, property_id, contact_id, status, proposed_times) values
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000013', 'requested', array['2026-08-15T11:00:00Z','2026-08-16T14:00:00Z']);

insert into tasks (id, agency_id, entity_type, entity_id, assignee_user_id, title, body, status) values
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a2', 'Confirm viewing time with vendor for EH78901', 'Proposed times: 2026-08-15T11:00:00Z, 2026-08-16T14:00:00Z', 'open');

-- Post-viewing feedback notes (entity_type = 'viewing'), the same channel
-- POST /viewings/:id/feedback writes to.
insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body) values
  ('00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-000000000008', 'ai', null, 'Buyer really liked the location and the light in the living room, slightly put off by the shared stair needing a repaint. Says he will discuss with his partner and call back this week.'),
  ('00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-000000000009', 'user', '00000000-0000-0000-0000-0000000000a1', 'Viewed with her solicitor''s advice in mind - loved the finish, asked about factoring costs. Very interested, likely to submit an offer soon.'),
  ('00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-00000000000a', 'ai', null, 'Walked the plot with the buyer - access lane confirmed fine once he saw it in person, despite the satnav confusion. Very keen, discussing self-build finance before offering.');

-- Offers and notes of interest, spread across statuses for a realistic board.
insert into offers (id, agency_id, property_id, contact_id, type, amount, status, solicitor_contact_id, received_via) values
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011', 'note_of_interest', null, 'open', null, 'ai_voice'),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012', 'offer', 390000, 'open', null, 'phone'),
  ('60000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000013', 'offer', 545000, 'countered', '10000000-0000-0000-0000-000000000006', 'email'),
  ('60000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000014', 'note_of_interest', null, 'open', null, 'ai_voice'),
  ('60000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002', 'offer', 205000, 'accepted', null, 'phone'),
  ('60000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000016', 'note_of_interest', null, 'open', null, 'ai_voice'),
  ('60000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', 'offer', 600000, 'rejected', null, 'phone');

-- More maintenance issues so all three board columns have something in them.
insert into maintenance_issues (id, agency_id, property_id, contact_id, description, status, urgency) values
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Kitchen tap dripping constantly, tenant raised concerns about the water bill.', 'resolved', 'low'),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 'Smoke alarm chirping intermittently, needs a new battery.', 'in_progress', 'normal'),
  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', 'Boundary fence panel blown down in last week''s storm.', 'reported', 'high');

-- Contact-level call summaries for the new buyers, matching the "AI writes a
-- note before hanging up" pattern.
insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body) values
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000011', 'ai', null, 'AI · Mon 9:14am — Booked viewing at 22 Marchmont Crescent for Tuesday 10am. First-time buyer, mortgage agreed in principle.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000012', 'ai', null, 'AI · Wed 2:30pm — Registered an offer of £390,000 on 22 Marchmont Crescent. Chain-free, keen to move quickly.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000013', 'user', '00000000-0000-0000-0000-0000000000a2', 'Countered his £545,000 offer on 5 Comely Bank Avenue at asking. Awaiting his response, solicitor already instructed.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000014', 'ai', null, 'AI · Thu 11:50am — Registered interest in 88 Sauchiehall Street. Wants a second viewing before deciding.');

-- Property-level staff commentary, not tied to a specific viewing or offer.
insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body) values
  ('00000000-0000-0000-0000-000000000001', 'property', '20000000-0000-0000-0000-000000000008', 'user', '00000000-0000-0000-0000-0000000000a1', 'Vendor confirmed she''s happy to consider part-exchange discussions if a buyer has a property to sell.');
