-- Removes the test listings, contacts, and related records created while
-- curl-verifying the new POST/PATCH /properties endpoints and the
-- create-listing/viewing/offer/maintenance flow end-to-end.

delete from maintenance_issues where property_id = (select id from properties where ref = 'EH12292');
delete from offers where property_id = (select id from properties where ref = 'EH12292');
delete from viewings where property_id = (select id from properties where ref = 'EH12292');
delete from properties where ref in ('EH12292', 'EH71514');
delete from contacts where phone_primary in ('+447700999901', '+447700999902');
