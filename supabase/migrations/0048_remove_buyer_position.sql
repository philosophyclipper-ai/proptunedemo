-- Mortgage status and property ownership status are no longer structured
-- fields — handled as free text in notes instead. Dropping the column
-- drops its check constraint with it (contacts_mortgage_status_check,
-- contacts_property_ownership_status_check, viewings_mortgage_status_check,
-- viewings_buyer_property_status_check).

alter table contacts drop column mortgage_status;
alter table contacts drop column property_ownership_status;

alter table viewings drop column mortgage_status;
alter table viewings drop column buyer_property_status;
