-- Captures a buyer's position at the point a sales viewing is booked
-- (mortgage readiness and their own property status), and a solicitor's
-- firm on an offer's solicitor contact.

alter table viewings add column mortgage_status text;
alter table viewings add constraint viewings_mortgage_status_check
  check (mortgage_status is null or mortgage_status in (
    'not_required', 'mortgage_required', 'approved_in_principle'
  ));

alter table viewings add column buyer_property_status text;
alter table viewings add constraint viewings_buyer_property_status_check
  check (buyer_property_status is null or buyer_property_status in (
    'first_time_buyer', 'chain_free', 'on_the_market', 'under_offer', 'sold'
  ));

alter table contacts add column company text;
