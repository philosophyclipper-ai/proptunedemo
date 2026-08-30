-- Jean-Piere's phone_primary was literally the string "White" — a surname
-- that ended up in the wrong field, created via the UI on 2026-08-12. The
-- add-contact form has no format validation on this field (plain <input>,
-- presence-only check both client and server side), so nothing stopped it
-- at the time and nothing stops it today. The real original number was
-- never captured anywhere, so this is a fresh placeholder, not a recovery.

update contacts set phone_primary = '+447700903006'
  where id = 'c740d1d4-4d2d-4fb9-a038-d89adf70d204' and phone_primary = 'White';
