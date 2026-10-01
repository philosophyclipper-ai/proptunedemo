-- Phone matching moves from the API layer into the database.
--
-- GET /contacts?phone= and GET /contacts/resolve both read every contact in
-- the agency and filtered them in JavaScript, because the match rule isn't
-- string equality: numbers are stored inconsistently (+447700900202,
-- 07700900202, "07700 900202" are the same person), and a match can come from
-- phone_primary, phone_secondary or the additional_numbers array. None of that
-- is expressible as a plain PostgREST filter, so the route fetched the lot.
--
-- These functions encode exactly the rules in lib/api/phone.ts so the filter
-- can run in Postgres against an index instead:
--   1. strip non-digits
--   2. leading '44' on a 12-digit number is dropped (E.164 -> national)
--   3. a leading '0' is dropped (national -> bare)
--   4. compare the last 10 digits, except when either side is shorter than
--      7 digits, which compares literally so a short landline fragment can't
--      match inside a longer number
--   5. an empty value never matches anything, so garbage in the phone field
--      (there is a contact whose number was literally "White") can't match
--      every other garbage row
--
-- Behaviour is unchanged for every existing caller: same rules, same results,
-- just evaluated in the right place.

create or replace function phone_digits(raw text)
returns text
language sql
immutable
as $$
  select case
    when d like '44%' and length(d) = 12 then substr(d, 3)
    when d like '0%' then substr(d, 2)
    else d
  end
  from (select regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g') as d) s;
$$;

comment on function phone_digits(text) is
  'Normalises a phone number to bare digits, mirroring normalizePhone() in lib/api/phone.ts.';

-- Rule 4 above, as a standalone predicate. Kept separate so the comparison
-- lives in one place even though contacts_by_phone inlines an index-friendly
-- form of it.
create or replace function phones_match(a text, b text)
returns boolean
language sql
immutable
as $$
  select case
    when na = '' or nb = '' then false
    when length(na) < 7 or length(nb) < 7 then na = nb
    else right(na, 10) = right(nb, 10)
  end
  from (select phone_digits(a) as na, phone_digits(b) as nb) s;
$$;

comment on function phones_match(text, text) is
  'True when two phone numbers refer to the same line, mirroring phonesMatch() in lib/api/phone.ts.';

-- Returns every contact in the agency holding this number in any of its three
-- places. Written so the >= 7 digit case (every real lookup) compares against
-- the indexed expression below rather than calling phones_match per row.
create or replace function contacts_by_phone(p_agency_id uuid, p_phone text)
returns setof contacts
language sql
stable
as $$
  with probe as (select phone_digits(p_phone) as n)
  select c.*
  from contacts c, probe p
  where c.agency_id = p_agency_id
    and p.n <> ''
    and case
      when length(p.n) >= 7 then
        right(phone_digits(c.phone_primary), 10) = right(p.n, 10)
        or right(phone_digits(c.phone_secondary), 10) = right(p.n, 10)
        or exists (
          select 1 from unnest(c.additional_numbers) extra
          where right(phone_digits(extra), 10) = right(p.n, 10)
        )
      else
        phone_digits(c.phone_primary) = p.n
        or phone_digits(c.phone_secondary) = p.n
        or exists (
          select 1 from unnest(c.additional_numbers) extra
          where phone_digits(extra) = p.n
        )
    end;
$$;

comment on function contacts_by_phone(uuid, text) is
  'Every contact holding this number in phone_primary, phone_secondary or additional_numbers. Backs GET /contacts?phone= and GET /contacts/resolve.';

create index contacts_phone_primary_digits_idx
  on contacts (right(phone_digits(phone_primary), 10));
create index contacts_phone_secondary_digits_idx
  on contacts (right(phone_digits(phone_secondary), 10));

-- Supports GET /contacts?email=, which was previously not offered at all.
create index contacts_email_lower_idx on contacts (lower(email));

-- Supports GET /viewings?contact_id=, likewise new. property_id is already
-- indexed (0001); this is its missing counterpart.
create index viewings_contact_property_idx on viewings (contact_id, property_id);
