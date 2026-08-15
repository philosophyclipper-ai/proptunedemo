-- Removes an orphaned test contact (unreferenced by any viewing or offer,
-- left over from earlier curl-verification and further touched while
-- verifying the new contact-level mortgage_status/property_ownership_status
-- fields don't get wiped by forms that don't render them).

delete from contacts where id = '769c923d-a885-4505-9af4-91a87c3215a5';
