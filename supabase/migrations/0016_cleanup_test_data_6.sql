-- Removes the test contact created while curl-verifying the new
-- confirmed/unconfirmed checkbox toggle on the viewing edit form. The
-- test viewing itself was already removed by the DELETE call during
-- testing.

delete from contacts where phone_primary = '+447700999966';
