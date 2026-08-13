-- Every listing needs a named negotiator and a date it went live, matching
-- how Reapit/Alto track ownership and time-on-market. Negotiator is a real
-- link to users (role negotiator), not free text.

alter table properties add column went_live_at timestamptz;
alter table properties add column negotiator_id uuid references users(id);

insert into users (id, agency_id, name, email, role)
select
  '00000000-0000-0000-0000-0000000000a3',
  agencies.id,
  'Finlay Jack',
  'contact.finlayjack@gmail.com',
  'negotiator'
from agencies
limit 1;

update properties
set
  negotiator_id = '00000000-0000-0000-0000-0000000000a3',
  went_live_at = created_at;
