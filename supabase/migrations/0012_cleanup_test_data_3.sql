-- Removes the test viewing and contacts created while curl-verifying the
-- new contractor role and the auto-upsert-into-contacts-list behaviour.

delete from viewings where id = 'cd3e20ed-79c3-4ab8-99ca-a0fe1e53a3c4';
delete from contacts where phone_primary in ('+447700999920', '+447700999921');
