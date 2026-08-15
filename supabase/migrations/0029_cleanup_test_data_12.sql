-- Removes the throwaway contact created while curl-verifying that
-- mortgage_status/property_ownership_status can be set at creation time
-- (POST /contacts) as well as via PATCH.

delete from contacts where id = '27c0ccd5-ade6-44b4-bba4-5d3f2170f620';
