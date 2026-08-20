-- Removes the leftover test contact from validating the new
-- DELETE /api/v1/properties/:ref cascade cleanup (the throwaway property
-- and everything attached to it were already removed by the DELETE call
-- itself; the two real London Road test properties were also deleted via
-- the same endpoint at the user's request).

delete from contacts where phone_primary = '+447700900777';
