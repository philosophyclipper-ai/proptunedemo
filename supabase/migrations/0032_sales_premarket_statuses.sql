-- Three pre-market stages for sales properties, ahead of 'available':
-- valued -> instructed -> photographed -> available. An outbound webhook
-- fires when a property transitions into 'photographed' (see
-- PATCH /api/v1/properties/:ref), kicking off an n8n workflow that drafts
-- the property ad from the CRM record.

alter table properties drop constraint properties_status_check;
alter table properties add constraint properties_status_check
  check (status in (
    'valued', 'instructed', 'photographed',
    'available', 'under_offer', 'sold', 'withdrawn',
    'on_market', 'let'
  ));
