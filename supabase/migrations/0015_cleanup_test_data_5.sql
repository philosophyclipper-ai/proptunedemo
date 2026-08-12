-- Removes the test contact created while curl-verifying the new
-- DELETE /api/v1/viewings/:id endpoint and the viewing approve/decline
-- quick actions. The test viewing, its note, and its task were already
-- removed by the DELETE call itself (cascade verified during testing).

delete from contacts where phone_primary = '+447700999955';
