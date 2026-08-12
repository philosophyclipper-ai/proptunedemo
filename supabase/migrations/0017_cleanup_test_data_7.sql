-- Removes viewings and the contact created while curl-verifying the new
-- explicit status override on POST /viewings (used by the Add Viewing
-- form's Confirmed checkbox), across both vendor-led and agency-led
-- properties, plus the default-unchanged voice/n8n path.

delete from viewings where id in (
  '8abb8726-7236-436e-b901-5a0bb4f11327',
  '00a82442-60a9-4d0d-804b-519310aa7089',
  '3f8c4093-bda7-4ae2-886f-122618d2a896',
  'bc944d84-d4c2-4de1-bad5-5de1f29fc06d',
  'e623979a-3f6a-4614-a972-943792a6d66e'
);
delete from contacts where phone_primary = '+447700999977';
