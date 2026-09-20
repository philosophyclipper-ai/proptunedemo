-- Restores contact Aisha Farooq and her offer on EH12345, deleted in error by
-- scripts/seed-wilson-tests.mjs on its first run. The script deletes test
-- contacts by phone number, and she held +447700900303 — a number the Wilson
-- test fixture needs — so the phone-matched delete swept her up before the
-- step that was supposed to move her to a free number could run. The script
-- now relocates first and refuses to delete her by name (two guards, since
-- this is the second time a delete in this repo has cost a real record — see
-- 0037).
--
-- Restored from supabase/seed.sql (the contact and her original note) and
-- migration 0037 (the offer). Written idempotently so it is safe to apply to
-- a database where the rows already exist, or to replay from scratch.
--
-- NOT restored, because it was never captured anywhere: one viewing of hers,
-- created live rather than seeded, along with any notes attached to it. It
-- was not on EH12345, EH11656 or EH45678 — all of those properties' viewings
-- are accounted for before and after the deletion — leaving EH67890 or a
-- property outside the fixture as its likely home. Its id, property, status
-- and time are unrecoverable.
--
-- She is restored on +447700900310, not her original +447700900303. The
-- fixture needs 303 for Andrew Sutherland, and moving her there was the
-- agreed resolution before any of this went wrong; only the means changed.

insert into contacts (id, agency_id, name, roles, phone_primary, phone_secondary, email)
values (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Aisha Farooq',
  array['buyer','applicant'],
  '+447700900310',
  '+441315550303',
  null
)
on conflict (id) do nothing;

-- Offer values come from 0037, which itself reconstructed them after an
-- earlier accidental deletion. amount/status/received_via are therefore
-- best-effort rather than a capture of the live row as it stood.
insert into offers (
  id, agency_id, property_id, contact_id, type, amount, status, received_via, created_at
)
values (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'offer', 250000, 'open', 'phone',
  '2026-08-07T19:13:36.615693Z'
)
on conflict (id) do nothing;

-- Her original contact note, verbatim from seed.sql.
insert into notes (agency_id, entity_type, entity_id, author_type, author_user_id, body)
select
  '00000000-0000-0000-0000-000000000001',
  'contact',
  '10000000-0000-0000-0000-000000000003',
  'ai',
  null,
  'AI · Mon 11:05am — Registered interest in 14 Rose Street on behalf of caller. No amount discussed, wants to view first.'
where not exists (
  select 1 from notes
  where entity_type = 'contact'
    and entity_id = '10000000-0000-0000-0000-000000000003'
    and body like 'AI · Mon 11:05am%'
);
