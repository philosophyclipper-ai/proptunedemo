-- Lettings needs a "contractor" role (tradespeople logged against
-- maintenance issues), alongside the existing vendor/landlord/buyer/
-- tenant/applicant/solicitor set.

alter table contacts drop constraint contacts_roles_check;
alter table contacts add constraint contacts_roles_check check (
  roles <@ array['vendor','landlord','buyer','tenant','applicant','solicitor','contractor']::text[]
);
