-- A viewing time is now optional at booking. Without one there's nothing
-- to propose or confirm, so it needs its own status rather than being
-- forced into "requested".

alter table viewings drop constraint viewings_status_check;
alter table viewings add constraint viewings_status_check check (
  status in ('incomplete', 'requested', 'confirmed', 'cancelled', 'completed')
);
