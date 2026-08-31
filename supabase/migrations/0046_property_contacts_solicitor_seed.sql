-- The only property_contacts row so far (Neil Sinclair, EH45678) is
-- role='vendor', already covered by the vendors embed. Seeds a non-vendor
-- role so embed=property_contacts on /contacts is actually testable for
-- its stated case: a solicitor/landlord/tenant with no vendor or viewing
-- link, currently invisible to the voice agent.

insert into property_contacts (agency_id, property_id, contact_id, role) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000006', 'solicitor');
