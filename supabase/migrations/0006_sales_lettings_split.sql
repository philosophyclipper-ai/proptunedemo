-- Split the CRM into two separate sides: sales and lettings. A property is
-- one or the other, never both. Lettings properties drop the sales-only
-- price fields (asking_price, price_qualifier, home_report_*, tenure,
-- closing_date — none of these mean anything for a rental) and gain a rent
-- figure instead. Status vocabulary differs too: sales keeps its four
-- states, lettings is just on_market | let.

alter table properties add column listing_type text not null default 'sales';
alter table properties add constraint properties_listing_type_check
  check (listing_type in ('sales', 'lettings'));

alter table properties add column rent_amount numeric;
alter table properties add column rent_frequency text;
alter table properties add constraint properties_rent_frequency_check
  check (rent_frequency is null or rent_frequency in ('monthly', 'weekly'));

alter table properties add constraint properties_status_check
  check (status in ('available', 'under_offer', 'sold', 'withdrawn', 'on_market', 'let'));

create index properties_listing_type_idx on properties(listing_type);

-- Reclassify four existing properties as lettings. These were the ones
-- already carrying tenant-reported maintenance or simple enquiries rather
-- than firm purchase offers/solicitors, so the move is narratively clean.

update properties set
  listing_type = 'lettings', status = 'let', rent_amount = 850, rent_frequency = 'monthly',
  tenure = null, asking_price = null, price_qualifier = null, home_report_value = null,
  home_report_url = null, closing_date = null
where ref = 'G34567';

update properties set
  listing_type = 'lettings', status = 'on_market', rent_amount = 725, rent_frequency = 'monthly',
  tenure = null, asking_price = null, price_qualifier = null, home_report_value = null,
  home_report_url = null, closing_date = null
where ref = 'G56789';

update properties set
  listing_type = 'lettings', status = 'on_market', rent_amount = 650, rent_frequency = 'monthly',
  tenure = null, asking_price = null, price_qualifier = null, home_report_value = null,
  home_report_url = null, closing_date = null
where ref = 'AB12345';

update properties set
  listing_type = 'lettings', status = 'on_market', rent_amount = 1100, rent_frequency = 'monthly',
  tenure = null, asking_price = null, price_qualifier = null, home_report_value = null,
  home_report_url = null, closing_date = null
where ref = 'FK12345';

-- Their vendor contacts are now also landlords.
update contacts
set roles = (select array_agg(distinct r) from unnest(roles || array['landlord']::text[]) as r)
where id in (
  '10000000-0000-0000-0000-000000000001', -- Morag Sinclair (G34567)
  '10000000-0000-0000-0000-000000000015', -- Willie Thomson (G56789, AB12345)
  '10000000-0000-0000-0000-000000000009'  -- Hamish Reid (FK12345)
);

-- These two maintenance issues were logged against properties staying on
-- the sales side — exactly the mismatch that prompted this split. A
-- for-sale vendor's property doesn't go through the agency's maintenance
-- tracking, only a let one does.
delete from maintenance_issues where id in (
  '70000000-0000-0000-0000-000000000003', -- smoke alarm, EH23456 (sales)
  '70000000-0000-0000-0000-000000000004'  -- fence, EH67890 (sales)
);

-- Four fresh lettings-only properties, to get close to an even split.
insert into contacts (id, agency_id, name, roles, phone_primary, phone_secondary, email) values
  ('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Iain Sutherland', array['landlord'], '+447700901717', null, 'iain.sutherland@example.com'),
  ('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Grace Mackay', array['landlord'], '+447700901818', null, 'grace.mackay@example.com'),
  ('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Declan Murphy', array['tenant'], '+447700901919', null, 'declan.murphy@example.com'),
  ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Zara Ahmed', array['applicant'], '+447700902020', null, 'zara.ahmed@example.com'),
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Ben Carter', array['applicant'], '+447700902121', null, null),
  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Yusuf Khan', array['applicant'], '+447700902222', null, 'yusuf.khan@example.com');

insert into properties (
  id, agency_id, ref, address_line1, address_line2, city, postcode, bedrooms,
  property_type, tenure, status, listing_type, rent_amount, rent_frequency,
  council_tax_band, epc_rating, vendor_contact_id,
  viewing_conducted_by, viewing_calendar_id, viewing_notes
) values
  (
    '20000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001',
    'EH89012', '8 Dalry Road', null, 'Edinburgh', 'EH11 2BT', 2,
    'flat', null, 'on_market', 'lettings', 1050, 'monthly',
    'C', 'D', '10000000-0000-0000-0000-000000000017',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Vacant, not yet photographed - keys at office.'
  ),
  (
    '20000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001',
    'G78901', '45 Dumbarton Road', 'Flat 2', 'Glasgow', 'G11 6PN', 0,
    'flat', null, 'let', 'lettings', 625, 'monthly',
    'B', 'D', '10000000-0000-0000-0000-000000000018',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Tenanted - access only with 24h notice to the tenant.'
  ),
  (
    '20000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001',
    'EH90123', '12 Restalrig Road', null, 'Edinburgh', 'EH6 8BN', 3,
    'house', null, 'on_market', 'lettings', 1650, 'monthly',
    'E', 'C', '10000000-0000-0000-0000-000000000017',
    'vendor', null,
    'Landlord lives next door - knock for him directly, he is usually in except Tuesdays.'
  ),
  (
    '20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
    'AB23456', '7 Rosemount Place', 'Flat 1', 'Aberdeen', 'AB25 2XA', 0,
    'flat', null, 'on_market', 'lettings', 145, 'weekly',
    'B', 'E', '10000000-0000-0000-0000-000000000018',
    'agency_staff', 'proptune-demo-calendar@group.calendar.google.com',
    'Vacant, not yet photographed - keys at office.'
  );

insert into viewings (id, agency_id, property_id, contact_id, status, scheduled_at, calendar_event_id) values
  ('50000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000020', 'confirmed', '2026-08-13T11:00:00Z', 'demo-cal-event-3401'),
  ('50000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000021', 'confirmed', '2026-08-14T17:00:00Z', 'demo-cal-event-3402'),
  ('50000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000022', 'confirmed', '2026-08-11T13:00:00Z', 'demo-cal-event-3403');

-- "Applications" in the lettings UI reads from this same table (type =
-- note_of_interest) — reusing the existing offers/notes-of-interest model
-- rather than building a separate referencing system, which CLAUDE.md
-- explicitly keeps out of scope.
insert into offers (id, agency_id, property_id, contact_id, type, amount, status, received_via) values
  ('60000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000020', 'note_of_interest', null, 'open', 'ai_voice'),
  ('60000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000021', 'note_of_interest', null, 'open', 'phone'),
  ('60000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000022', 'note_of_interest', null, 'open', 'ai_voice');

insert into maintenance_issues (id, agency_id, property_id, contact_id, description, status, urgency) values
  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000019', 'Heating not coming on via the timer, thermostat may need replacing.', 'in_progress', 'normal'),
  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', null, 'Communal stair light broken, factor notified.', 'reported', 'low');

insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body) values
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000020', 'ai', null, 'AI · Tue 3:05pm — Booked viewing at 8 Dalry Road for Thursday 11am. Working professional, no pets, references ready.'),
  ('00000000-0000-0000-0000-000000000001', 'contact', '10000000-0000-0000-0000-000000000019', 'user', '00000000-0000-0000-0000-0000000000a2', 'Reported heating timer fault at 45 Dumbarton Road. Contractor booked for Thursday.');
