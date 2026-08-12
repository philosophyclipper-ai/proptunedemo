-- Removes test data created while curl-verifying additional offer
-- contacts, the amount-increase note, direct viewing edits, maintenance
-- status edits, and contact edits.

delete from notes where id in (
  '7cb6e0b5-742e-4d61-97ea-55ab0f0c598f',
  'd63045bd-719c-4367-9acf-b46669f948c7'
);
delete from offer_contacts where offer_id = '60000000-0000-0000-0000-000000000001';
delete from contacts where phone_primary = '+447700999930';

update offers set amount = 250000 where id = '60000000-0000-0000-0000-000000000001';
update viewings set status = 'requested', scheduled_at = null
  where id = '50000000-0000-0000-0000-000000000001';
update maintenance_issues set status = 'reported'
  where id = '70000000-0000-0000-0000-000000000001';
update contacts set company = null
  where id = '10000000-0000-0000-0000-000000000002';
