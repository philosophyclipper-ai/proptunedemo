-- The n8n viewing coordinator now determines vendor-led vs agent-led by
-- scanning properties.viewing_notes for the literal text "viewing_vendor"
-- or "viewing_agent", since the structured viewing_conducted_by flag was
-- removed (migration 0030) as unrealistically easy for an integration to
-- rely on. Adds that marker as the lead bullet on every property, using
-- each one's real original arrangement (captured before 0030 folded it
-- into free text) rather than guessing from the prose.

update properties set viewing_notes =
  '- viewing_vendor
- New instruction, still finalising access arrangements with the seller
- Check back before booking anything firm'
  where ref = 'EH11656';

update properties set viewing_notes =
  '- viewing_vendor
- Owner works shifts, evenings after 6pm usually fine, never Sundays
- Dog in the flat below barks if you buzz twice - just wait
- Owner sometimes forgets and needs a reminder call'
  where ref = 'EH12345';

update properties set viewing_notes =
  '- viewing_agent
- Keys held at office
- No access restrictions'
  where ref = 'EH23456';

update properties set viewing_notes =
  '- viewing_vendor
- Vendor still living there w/ 2 kids + big dog (friendly but LOUD)
- NOT before 9am or during school run 8:15-8:45
- Weekends better
- Call her mobile not landline, she never answers landline'
  where ref = 'EH45678';

update properties set viewing_notes =
  '- viewing_agent
- Vacant
- Lockbox code 4471'
  where ref = 'EH56789';

update properties set viewing_notes =
  '- viewing_agent
- Tenant moved out last month, now vacant
- Keys at office, no restrictions'
  where ref = 'EH67890';

update properties set viewing_notes =
  '- viewing_vendor
- Vendor works from home most days - avoid 9-11am, she is always on video calls then
- Two cats, keep the front door shut tight or they bolt
- Text first, she often misses calls'
  where ref = 'EH78901';

update properties set viewing_notes =
  '- viewing_agent
- Vacant, not yet photographed
- Keys at office'
  where ref = 'EH89012';

update properties set viewing_notes =
  '- viewing_vendor
- Landlord lives next door - knock for him directly
- Usually in except Tuesdays'
  where ref = 'EH90123';
