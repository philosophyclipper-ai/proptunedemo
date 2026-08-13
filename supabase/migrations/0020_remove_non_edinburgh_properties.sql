-- Simplify the demo dataset to Edinburgh only. Removes every property
-- outside Edinburgh, and everything that hangs off it (photos cascade
-- automatically; viewings/offers/maintenance/valuations/notes/tasks don't,
-- so they're cleaned up explicitly here).

create temporary table target_properties as
  select id from properties where ref in (
    'AB23456', 'G78901', 'AB12345', 'FK12345', 'G67890', 'G56789', 'G45678', 'G34567'
  );

create temporary table target_viewings as
  select id from viewings where property_id in (select id from target_properties);

create temporary table target_offers as
  select id from offers where property_id in (select id from target_properties);

create temporary table target_maintenance as
  select id from maintenance_issues where property_id in (select id from target_properties);

delete from offer_contacts where offer_id in (select id from target_offers);

delete from notes where
  (entity_type = 'property' and entity_id in (select id from target_properties)) or
  (entity_type = 'viewing' and entity_id in (select id from target_viewings)) or
  (entity_type = 'offer' and entity_id in (select id from target_offers)) or
  (entity_type = 'maintenance_issue' and entity_id in (select id from target_maintenance));

delete from tasks where
  (entity_type = 'property' and entity_id in (select id from target_properties)) or
  (entity_type = 'viewing' and entity_id in (select id from target_viewings)) or
  (entity_type = 'offer' and entity_id in (select id from target_offers)) or
  (entity_type = 'maintenance_issue' and entity_id in (select id from target_maintenance));

delete from viewings where id in (select id from target_viewings);
delete from offers where id in (select id from target_offers);
delete from maintenance_issues where id in (select id from target_maintenance);
delete from valuations where property_id in (select id from target_properties);

delete from properties where id in (select id from target_properties);

drop table target_properties, target_viewings, target_offers, target_maintenance;
