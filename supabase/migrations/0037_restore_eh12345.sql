-- Restores property EH12345 (14/2 Rose Street) and its dependent rows,
-- accidentally hard-deleted via a mistaken DELETE call during this session's
-- testing. Reconstructed from: (a) a full property JSON snapshot captured
-- live moments before the deletion, (b) the property's timeline captured
-- live moments before the deletion, (c) original seed values still present
-- in migrations 0003 and 0014 for the child rows that were seeded pre-history.
--
-- Fields marked RECONSTRUCTED below were not captured anywhere and are
-- best-effort placeholders, not the true original values.

insert into properties (
  id, agency_id, ref, address_line1, address_line2, city, postcode, bedrooms,
  property_type, tenure, status, listing_type, price_qualifier, asking_price,
  home_report_value, home_report_url, rent_amount, rent_frequency,
  council_tax_band, epc_rating, vendor_contact_id, viewing_calendar_id,
  viewing_notes, closing_date, went_live_at, negotiator_id, description,
  created_at
) values (
  '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  'EH12345', '14/2 Rose Street', null, 'Edinburgh', 'EH2 2PR', 2,
  'flat', 'feuhold', 'available', 'sales', 'fixed_price', 225000,
  230000, 'https://mzqqknlzbrtrdtotmgkv.supabase.co/storage/v1/object/public/property-media/reports/eh12345.pdf',
  null, null,
  'D', 'C', '10000000-0000-0000-0000-000000000001', null,
  '- viewing_vendor
- Owner works shifts, evenings after 6pm usually fine, never Sundays
- Dog in the flat below barks if you buzz twice - just wait
- Owner sometimes forgets and needs a reminder call',
  null, '2026-08-07T19:13:36.615693Z', '00000000-0000-0000-0000-0000000000a3',
  'A well-proportioned two-bedroom flat on Rose Street, in the very heart of Edinburgh''s New Town. Within easy walking distance of Princes Street, George Street and the city''s main shopping and dining districts, this makes an excellent city-centre home or investment purchase, with the added benefit of the building''s characterful traditional features.',
  '2026-08-07T19:13:36.615693Z'
);

insert into property_photos (agency_id, property_id, url, sort_order) values (
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'https://mzqqknlzbrtrdtotmgkv.supabase.co/storage/v1/object/public/property-media/photos/eh12345-real.jpg',
  0
);

-- Viewing 1: seeded originally, contact Callum Wallace. Status + scheduled_at
-- confirmed via migration 0014. proposed_times is RECONSTRUCTED (never
-- captured) — required non-null for status=requested, filled with a
-- plausible pair of evening slots consistent with the vendor's own notes.
insert into viewings (id, agency_id, property_id, contact_id, status, proposed_times, created_at) values (
  '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  'requested', array['2026-08-14T18:30:00Z','2026-08-15T19:00:00Z'],
  '2026-08-07T19:13:36.615693Z'
);

-- Viewing 2: seeded originally, contact Kenny Boyle. Fully confirmed via
-- migration 0003 (scheduled_at, calendar_event_id) and the live timeline
-- capture (created_at).
insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at, calendar_event_id, created_at) values (
  '50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008',
  'completed', '2026-08-05T18:30:00Z', 'demo-cal-event-3305',
  '2026-08-07T21:19:18.555327Z'
);

-- Viewing 3: the real viewing created live during this session's n8n
-- testing (Callum Wallace, via create-enquiry). Fully confirmed via the
-- live timeline capture — status=incomplete inherently means no
-- scheduled_at/proposed_times were ever set.
insert into viewings (id, agency_id, property_id, contact_id, status, created_at) values (
  '16f19c97-e177-4e56-93d1-25f113392ce4', '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  'incomplete', '2026-08-20T23:03:34.139711Z'
);

-- Offer: seeded originally, contact Aisha Farooq. amount + status confirmed
-- (amount via migration 0014's reset value, status via the live timeline
-- capture). type='offer' follows from amount being non-null. received_via
-- is RECONSTRUCTED (never captured).
insert into offers (id, agency_id, property_id, contact_id, type, amount, status, received_via, created_at) values (
  '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
  'offer', 250000, 'open', 'phone',
  '2026-08-07T19:13:36.615693Z'
);

-- Viewing feedback note on viewing 2 — exact original text from migration 0003.
insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body, created_at) values (
  '00000000-0000-0000-0000-000000000001', 'viewing', '50000000-0000-0000-0000-000000000008',
  'ai', null,
  'Buyer really liked the location and the light in the living room, slightly put off by the shared stair needing a repaint. Says he will discuss with his partner and call back this week.',
  '2026-08-07T21:19:18.555327Z'
);
