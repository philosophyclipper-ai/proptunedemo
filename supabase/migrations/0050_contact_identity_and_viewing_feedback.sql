-- Two changes, both about a record meaning one thing.
--
-- 1. A phone number stops being a person's identity.
--
-- contacts_agency_phone_primary_idx made phone_primary unique per agency, so
-- POST /contacts had no choice but to treat a matching number as the same
-- human and update that row. In practice that meant a buyer enquiry from a
-- number already on file as a seller renamed the seller: one row went
-- "Jon James" -> "Finlay Jack" -> "John Jackson" -> "Hugh Wilson" over six
-- days, while staying attached as the vendor of EH30103 and EH45678. Anything
-- reading the seller's email off that record then wrote to the buyer.
--
-- Real CRMs key a person on an internal id and treat phone numbers as
-- attributes: two people genuinely can share a landline, and dedupe is an
-- explicit, audited merge rather than a silent overwrite. Dropping the unique
-- index lets them be two rows; the API layer decides when a number means the
-- same person (same name -> update) and when it doesn't (different name ->
-- new contact, flagged as a possible duplicate).
--
-- The lookup index stays, just without the uniqueness.

drop index if exists contacts_agency_phone_primary_idx;
create index contacts_agency_phone_primary_idx on contacts (agency_id, phone_primary);

-- 2. Viewing feedback separates from the running commentary.
--
-- Both lived in notes rows with entity_type 'viewing', so the same rows were
-- printed on the property page under "Feedback" and inside the viewing under
-- "Notes". The vendor-facing answer to "how did the viewing go" was buried in
-- a list of relay logs and tool errors.
--
-- Feedback is one per viewing and belongs to the viewing's lifecycle, so it
-- becomes a column. The existing notes stay exactly where they are and become
-- progress notes, visible only inside the viewing record — no data moves.

alter table viewings add column feedback text;
alter table viewings add column feedback_at timestamptz;

comment on column viewings.feedback is
  'How the viewing went, one per viewing, surfaced on the property page. Replaced on each write, not appended. The running log of arranging the viewing lives in notes with entity_type = ''viewing''.';
