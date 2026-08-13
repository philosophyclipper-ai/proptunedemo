-- Removes the notes created while curl-verifying the new batch
-- GET /contacts?ids= and GET /notes?entity_ids= endpoints added for the
-- performance pass on property/viewings/offers pages.

delete from notes where id in (
  '182d0727-0a83-4211-b207-16469e349461',
  '214834eb-5cbf-42af-a1e5-c3503fc04165',
  '1291908c-6e83-4a7d-82b3-24c3b8ddecab'
);
