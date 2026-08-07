-- The original seed/demo photo URLs pointed at storage.example.com, which
-- doesn't resolve to anything — they were placeholder data, not placeholder
-- images. Swap them for picsum.photos' seeded endpoint, which returns a
-- real, stable image per seed with no API key required, so the gallery and
-- lead-photo grid actually render something.

update property_photos set url = 'https://picsum.photos/seed/eh12345-1/800/600' where url = 'https://storage.example.com/photos/eh12345-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/eh12345-2/800/600' where url = 'https://storage.example.com/photos/eh12345-2.jpg';
update property_photos set url = 'https://picsum.photos/seed/eh23456-1/800/600' where url = 'https://storage.example.com/photos/eh23456-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/eh67890-1/800/600' where url = 'https://storage.example.com/photos/eh67890-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/eh67890-2/800/600' where url = 'https://storage.example.com/photos/eh67890-2.jpg';
update property_photos set url = 'https://picsum.photos/seed/eh78901-1/800/600' where url = 'https://storage.example.com/photos/eh78901-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/g56789-1/800/600' where url = 'https://storage.example.com/photos/g56789-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/g56789-2/800/600' where url = 'https://storage.example.com/photos/g56789-2.jpg';
update property_photos set url = 'https://picsum.photos/seed/g67890-1/800/600' where url = 'https://storage.example.com/photos/g67890-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/fk12345-1/800/600' where url = 'https://storage.example.com/photos/fk12345-1.jpg';
update property_photos set url = 'https://picsum.photos/seed/fk12345-2/800/600' where url = 'https://storage.example.com/photos/fk12345-2.jpg';
