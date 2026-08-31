-- One-time backfill matching what the new cron (app/api/cron/complete-viewings,
-- every 15 min via vercel.json) does going forward: a confirmed viewing
-- whose scheduled_at has passed becomes completed. Requested/incomplete
-- viewings with a past date are a separate, untouched problem — see the
-- accompanying report on how many of those exist.

update viewings
set status = 'completed'
where status = 'confirmed'
  and scheduled_at < now();
