-- Removes the structured vendor/viewing_agent/agency_staff flag entirely —
-- it made deciding how a viewing gets arranged too easy for an integration
-- to branch on, which isn't realistic. properties.viewing_notes becomes the
-- single source of truth: a few bullet points covering who shows the
-- property, general availability, and access notes. Reformatted the
-- existing demo notes into that shape (most already implied who runs
-- viewings without saying so outright — kept that ambiguity deliberately,
-- rather than adding an explicit label back in).

update properties set viewing_notes =
  '- Owner works shifts, evenings after 6pm usually fine, never Sundays
- Dog in the flat below barks if you buzz twice - just wait
- Owner sometimes forgets and needs a reminder call'
  where ref = 'EH12345';

update properties set viewing_notes =
  '- Keys held at office
- No access restrictions'
  where ref = 'EH23456';

update properties set viewing_notes =
  '- Vendor still living there w/ 2 kids + big dog (friendly but LOUD)
- NOT before 9am or during school run 8:15-8:45
- Weekends better
- Call her mobile not landline, she never answers landline'
  where ref = 'EH45678';

update properties set viewing_notes =
  '- Vacant
- Lockbox code 4471'
  where ref = 'EH56789';

update properties set viewing_notes =
  '- Tenant moved out last month, now vacant
- Keys at office, no restrictions'
  where ref = 'EH67890';

update properties set viewing_notes =
  '- Vendor works from home most days - avoid 9-11am, she is always on video calls then
- Two cats, keep the front door shut tight or they bolt
- Text first, she often misses calls'
  where ref = 'EH78901';

update properties set viewing_notes =
  '- Vacant, not yet photographed
- Keys at office'
  where ref = 'EH89012';

update properties set viewing_notes =
  '- Landlord lives next door - knock for him directly
- Usually in except Tuesdays'
  where ref = 'EH90123';

update properties set viewing_notes =
  '- New instruction, still finalising access arrangements with the seller
- Check back before booking anything firm'
  where ref = 'EH11656';

alter table properties drop constraint properties_viewing_conducted_by_check;
alter table properties drop column viewing_conducted_by;
