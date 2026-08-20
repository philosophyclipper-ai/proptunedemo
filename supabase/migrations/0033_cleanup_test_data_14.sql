-- Removes the property created while curl-verifying the simplified
-- onboarding defaults (status defaults to instructed, went_live_at stays
-- null until the listing actually reaches available/on_market).

delete from properties where ref = 'EH77577';
