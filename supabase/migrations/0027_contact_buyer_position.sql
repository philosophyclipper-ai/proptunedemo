-- Mortgage status and property ownership status move from being purely a
-- per-viewing snapshot to also living on the contact itself, so they're
-- visible and editable from the Contacts section directly, not just
-- captured once at the moment a viewing is booked.

alter table contacts add column mortgage_status text;
alter table contacts add constraint contacts_mortgage_status_check
  check (mortgage_status is null or mortgage_status in (
    'not_required', 'mortgage_required', 'approved_in_principle'
  ));

alter table contacts add column property_ownership_status text;
alter table contacts add constraint contacts_property_ownership_status_check
  check (property_ownership_status is null or property_ownership_status in (
    'first_time_buyer', 'chain_free', 'on_the_market', 'under_offer', 'sold'
  ));
