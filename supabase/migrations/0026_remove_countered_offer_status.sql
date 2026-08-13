-- Counter-offers aren't a thing in the Scottish system — offers stay open
-- (negotiated informally via solicitors) until accepted, rejected or
-- withdrawn. Reclassifies any existing "countered" offers as open; the
-- app no longer writes this status (POST /offers/:id/counter is removed).

update offers set status = 'open' where status = 'countered';
