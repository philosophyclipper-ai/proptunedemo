// One-off utility: uploads real photos from photos/ to Supabase Storage,
// replacing the SVG "Photo Pending" placeholders for a handful of
// properties. Not part of the running app.
//
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/upload-real-property-photos.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const BUCKET = "property-media";

const TARGETS = [
  { ref: "EH67890", file: "marchmont_crescent.jpg", contentType: "image/jpeg" },
  { ref: "EH45678", file: "morningside_road.jpg", contentType: "image/jpeg" },
  { ref: "EH12345", file: "rose_street.jpg", contentType: "image/jpeg" },
  { ref: "EH11656", file: "rose_street_2.jpeg", contentType: "image/jpeg" },
  { ref: "EH90123", file: "restalrig_road.jpg", contentType: "image/jpeg" },
  { ref: "EH89012", file: "dalry_road.jpg", contentType: "image/jpeg" },
];

async function main() {
  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id")
    .limit(1)
    .single();
  if (agencyError) throw agencyError;

  for (const target of TARGETS) {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, ref")
      .eq("ref", target.ref)
      .single();
    if (propertyError) throw propertyError;

    const ext = path.extname(target.file).slice(1);
    const storagePath = `photos/${target.ref.toLowerCase()}-real.${ext}`;
    const bytes = await readFile(path.join("photos", target.file));

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: target.contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    const { error: deleteError } = await supabase
      .from("property_photos")
      .delete()
      .eq("property_id", property.id);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from("property_photos").insert({
      agency_id: agency.id,
      property_id: property.id,
      url: publicUrl,
      sort_order: 0,
    });
    if (insertError) throw insertError;

    console.log(`${target.ref} -> ${publicUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
