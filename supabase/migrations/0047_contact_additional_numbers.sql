-- A couple/office sharing a landline currently has to be modelled as two
-- contacts each holding the same number, which is exactly the ambiguity
-- item 7's duplicate detection has to work around rather than resolve —
-- they aren't duplicates of the same person, so flagging correctly leaves
-- them as two separate, still-ambiguous rows. This lets the number belong
-- to the right person: a second mobile, a partner's landline, without
-- spawning a row for it.

alter table contacts add column additional_numbers text[] not null default '{}';
