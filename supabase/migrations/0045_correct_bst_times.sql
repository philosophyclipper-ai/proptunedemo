-- Corrects viewing times that were stored as if wall-clock == UTC,
-- ignoring British Summer Time (UTC+1, in effect for every date below —
-- 2026 BST runs 2026-03-29 to 2026-10-25).
--
-- Three rows (real uuids, not seed-prefixed) are confirmed to have gone
-- through the actual buggy code path in production:
--   8a9e7e44-703e-4943-9d96-17d35a252e13 (scheduled_at)
--   1af34651-25a7-458b-83ed-793a5226d84c (proposed_times)
--   dba1c429-2941-4493-aa63-98f1f1d80f59 (proposed_times)
--
-- The remaining rows are seed data (50000000-... ids), authored directly
-- as SQL literals rather than through the buggy form, so there's no
-- code-path certainty for these the way there is for the three above.
-- They're corrected on the same principle anyway: every one is a
-- suspiciously round hour/half-hour during BST, consistent with having
-- been chosen to read as a natural local viewing slot without accounting
-- for the +1 offset — the same mistake, just made by hand instead of by
-- the form. Each row's current UTC clock-face reading is reinterpreted as
-- the originally-intended Europe/London wall time and corrected from there.

update viewings set scheduled_at = scheduled_at - interval '1 hour' where id in (
  '8a9e7e44-703e-4943-9d96-17d35a252e13',
  '50000000-0000-0000-0000-000000000008',
  '50000000-0000-0000-0000-000000000009',
  '50000000-0000-0000-0000-00000000000b',
  '50000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-00000000000c',
  '50000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-00000000000d',
  '50000000-0000-0000-0000-00000000000e',
  '50000000-0000-0000-0000-000000000010'
);

update viewings set proposed_times = (
  select array_agg((t::timestamptz - interval '1 hour')::text) from unnest(proposed_times) as t
) where id in (
  '1af34651-25a7-458b-83ed-793a5226d84c',
  'dba1c429-2941-4493-aa63-98f1f1d80f59',
  '50000000-0000-0000-0000-000000000005',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-00000000000f'
);
