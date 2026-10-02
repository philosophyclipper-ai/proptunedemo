-- A viewing that has happened isn't finished until someone says how it went.
--
-- The sweep moved a past 'confirmed' viewing straight to 'completed', which
-- made "completed" mean "the date passed" rather than "we know the outcome" —
-- and left nothing anywhere showing which viewings still owe the vendor an
-- answer. Real CRMs sit a viewing in an outstanding state until feedback is
-- recorded, because chasing it is a job someone does.
--
--   confirmed --(time passes)--> awaiting_feedback --(feedback saved)--> completed
--
-- 'completed' now means the outcome is known. Cancelled viewings are
-- untouched: they never happened, so there's nothing to report.

alter table viewings drop constraint viewings_status_check;
alter table viewings add constraint viewings_status_check check (
  status in ('incomplete', 'requested', 'confirmed', 'awaiting_feedback', 'cancelled', 'completed')
);

-- Existing rows sitting past-dated and still 'confirmed' (21 of them when
-- this was written, the oldest a month old, because the nightly sweep hasn't
-- been firing) move into the new state rather than being quietly marked
-- complete with no feedback behind them.
update viewings
set status = 'awaiting_feedback'
where status = 'confirmed'
  and scheduled_at < now()
  and (feedback is null or feedback = '');

-- Any that somehow already carry feedback skip the queue entirely.
update viewings
set status = 'completed'
where status = 'confirmed'
  and scheduled_at < now()
  and feedback is not null
  and feedback <> '';

-- Rows already marked 'completed' are deliberately left alone. Plenty of them
-- are historical demo viewings whose feedback was written as a note rather
-- than in the feedback column, and reopening those would invent a chasing job
-- that nobody actually has.
