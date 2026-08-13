-- Removes the viewing, note and contact created while curl-verifying the
-- timeline view fix and the Add Viewing notes field: a timeless viewing
-- (confirming it still creates as incomplete) with a note attached,
-- checked for correct contact_id/author_type resolution on the timeline.

delete from notes where id = '1af74290-3efb-451c-b28f-6f40ba6745c9';
delete from viewings where id = 'c8ed7155-dd02-4e11-855c-12367879b8d6';
delete from contacts where phone_primary = '+447700999911';
