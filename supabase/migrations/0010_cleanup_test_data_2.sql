-- Removes the test viewing, offer, and contacts created while curl-verifying
-- the new mortgage_status/buyer_property_status and solicitor company fields.

delete from viewings where id = 'defe252c-ce5f-4e19-a05b-d53efbb7a84b';
delete from offers where id = '19ade316-f5d0-493a-8da5-e98a160bc434';
delete from contacts where phone_primary in ('+447700999911', '+447700999912');
