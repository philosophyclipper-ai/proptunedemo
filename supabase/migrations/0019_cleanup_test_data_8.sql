-- Removes viewings and the contact created while curl-verifying the new
-- "incomplete" viewing status: default-to-incomplete when no time is
-- given, resistance to bypassing it via PATCH, and promotion to
-- requested/confirmed once a real time is added.

delete from viewings where id in (
  'b5be6694-a568-43e8-b74c-eb99bb85b22b',
  '0392b27f-d4b9-4ac1-b37c-0418704468e5',
  '9080d945-45de-4c6d-b415-61f02d14903a'
);
delete from contacts where phone_primary = '+447700999988';
