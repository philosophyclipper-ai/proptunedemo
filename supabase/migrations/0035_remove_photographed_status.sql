-- Removes "photographed" from the sales pipeline, keeping valued and
-- instructed. No property is currently in that status (the one test
-- listing that was got deleted directly beforehand), so this is a
-- straight constraint tightening, no data migration needed.

alter table properties drop constraint properties_status_check;
alter table properties add constraint properties_status_check
  check (status in (
    'valued', 'instructed',
    'available', 'under_offer', 'sold', 'withdrawn',
    'on_market', 'let'
  ));
