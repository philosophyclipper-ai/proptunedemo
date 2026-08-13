-- Free-text marketing description, its own column per listing so it can
-- later be generated/edited independently (e.g. by an AI copywriting
-- workflow in n8n) without touching any other field. Backfilled with
-- placeholder copy for the current demo dataset.

alter table properties add column description text;

update properties set description =
  'A bright one-bedroom flat set within a handsome traditional tenement on Rose Street, moments from George Street and the heart of Edinburgh''s New Town. The accommodation is well-proportioned throughout, with a comfortable lounge, fitted kitchen and a generous double bedroom. Ideally placed for the city''s best shopping, dining and transport links, this makes for a superb first-time buy or a compact city-centre pied-à-terre.'
  where ref = 'EH11656';

update properties set description =
  'A spacious three-bedroom terraced home on Restalrig Road, offering generous family living close to Lochend Park and Leith Links. The property benefits from a bright lounge, well-equipped kitchen, and a private rear garden — ideal for a family or group of sharers looking for space and easy access into the city centre and Leith.'
  where ref = 'EH90123';

update properties set description =
  'A well-presented two-bedroom flat on Dalry Road, within easy walking distance of Haymarket station and the west end of the city centre. The flat offers a comfortable lounge, fitted kitchen and two good-sized bedrooms, making it a popular choice for professionals and sharers wanting fast links to the tram, rail and business district.'
  where ref = 'EH89012';

update properties set description =
  'An impressive four-bedroom family home on the ever-popular Comely Bank Avenue, within easy reach of Stockbridge and the Water of Leith walkway. The property offers well-proportioned family accommodation across two floors, with a bright principal lounge, generous kitchen/diner and a private garden — an excellent opportunity for buyers seeking space in one of Edinburgh''s most sought-after residential pockets.'
  where ref = 'EH78901';

update properties set description =
  'A handsome three-bedroom flat within one of Marchmont''s classic traditional tenements, ideally placed for Bruntsfield Links, The Meadows and the city''s south side amenities. The apartment retains a wealth of period charm, with high ceilings and traditional finishes throughout, complemented by a well-appointed kitchen and generous public rooms — a superb example of Marchmont living.'
  where ref = 'EH67890';

update properties set description =
  'A charming two-bedroom top-floor flat on Leith Walk, set within easy reach of the tram line and the vibrant bars, restaurants and independent shops that make Leith so popular. The property offers bright, well-proportioned accommodation throughout and represents an excellent opportunity for first-time buyers or investors looking to be at the heart of one of Edinburgh''s most dynamic neighbourhoods.'
  where ref = 'EH56789';

update properties set description =
  'A rare and substantial four-bedroom flat on Morningside Road, offering generous family accommodation in one of Edinburgh''s most desirable south-side suburbs. The property combines traditional character with practical family living, and sits within easy reach of Morningside''s excellent local shops, cafes and highly regarded schools.'
  where ref = 'EH45678';

update properties set description =
  'A stylish three-bedroom flat set within the picturesque surroundings of Dean Village, one of Edinburgh''s most photographed and sought-after conservation areas. The apartment offers contemporary, well-presented accommodation just a short stroll from the Water of Leith, Stockbridge and the West End — city living with a village feel.'
  where ref = 'EH23456';

update properties set description =
  'A well-proportioned two-bedroom flat on Rose Street, in the very heart of Edinburgh''s New Town. Within easy walking distance of Princes Street, George Street and the city''s main shopping and dining districts, this makes an excellent city-centre home or investment purchase, with the added benefit of the building''s characterful traditional features.'
  where ref = 'EH12345';
