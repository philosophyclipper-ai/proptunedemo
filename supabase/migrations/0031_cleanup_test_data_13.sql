-- Removes the viewings and contact created while curl-verifying that
-- POST /viewings is now purely payload-driven (proposed_times vs
-- scheduled_at) rather than gated by the removed viewing_conducted_by
-- property flag, plus the task auto-created alongside the requested one.

delete from tasks where entity_type = 'viewing' and entity_id = 'c1b0c39d-3fa3-474d-a5a3-a9a420c2843e';
delete from viewings where id in (
  '647074b7-391e-41d7-a558-0d3374b683fb',
  'c1b0c39d-3fa3-474d-a5a3-a9a420c2843e'
);
delete from contacts where phone_primary = '+447700900444';
