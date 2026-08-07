// One-off utility: generates branded placeholder photos (SVG) and single-page
// Home Report PDFs for demo properties, and uploads them to a public
// Supabase Storage bucket. Not part of the running app — run manually
// whenever new demo properties need media:
//
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/generate-property-media.mjs
//
// Prints the public URLs it uploaded so they can be pasted into a migration.

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const BUCKET = "property-media";

// PropTune palette, matching app/globals.css
const NAVY = "#0F1B30";
const NAVY_BODY = "#223255";
const AMBER = "#E3AC47";
const CREAM = "#F1E9D8";
const INK_FAINT = "#8B97A8";

function houseSvg(address, caption) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${CREAM}"/>
  <g transform="translate(300,170)">
    <polygon points="100,0 0,90 200,90" fill="${NAVY}"/>
    <rect x="20" y="90" width="160" height="120" fill="${NAVY_BODY}"/>
    <rect x="88" y="152" width="44" height="58" fill="${CREAM}"/>
    <rect x="38" y="112" width="32" height="30" fill="${AMBER}"/>
    <rect x="130" y="112" width="32" height="30" fill="${AMBER}"/>
  </g>
  <text x="400" y="430" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="600" fill="${NAVY}" text-anchor="middle">${escapeXml(address)}</text>
  <text x="400" y="464" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" fill="${INK_FAINT}" text-anchor="middle">${caption.toUpperCase()}</text>
</svg>`;
}

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function generateReportPdf(ref, address) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const body = await doc.embedFont(StandardFonts.TimesRoman);

  const navy = rgb(0x0f / 255, 0x1b / 255, 0x30 / 255);
  const muted = rgb(0x5b / 255, 0x6b / 255, 0x80 / 255);

  page.drawText("Home Report", { x: 60, y: 740, size: 32, font: serif, color: navy });
  page.drawText(address, { x: 60, y: 690, size: 16, font: body, color: navy });
  page.drawText(`Reference: ${ref}`, { x: 60, y: 665, size: 12, font: body, color: muted });
  page.drawLine({ start: { x: 60, y: 640 }, end: { x: 535, y: 640 }, thickness: 1, color: muted });
  page.drawText(
    "This is placeholder demo content for the PropTune Demo CRM — it does not",
    { x: 60, y: 600, size: 11, font: body, color: muted }
  );
  page.drawText(
    "represent a real Home Report survey.",
    { x: 60, y: 584, size: 11, font: body, color: muted }
  );

  return doc.save();
}

const PROPERTIES = [
  { ref: "EH12345", address: "14 Rose Street, Edinburgh, EH2 2PR", photos: 2, report: true },
  { ref: "EH23456", address: "2 Dean Village Court, Flat 3, Edinburgh, EH4 3BS", photos: 1, report: false },
  { ref: "G34567", address: "9 Byres Road, Glasgow, G12 8SQ", photos: 0, report: true },
  { ref: "EH56789", address: "3 Leith Walk, Top Floor, Edinburgh, EH6 8LN", photos: 0, report: true },
  { ref: "EH67890", address: "22 Marchmont Crescent, Edinburgh, EH9 1HG", photos: 2, report: true },
  { ref: "EH78901", address: "5 Comely Bank Avenue, Edinburgh, EH4 1EP", photos: 1, report: false },
  { ref: "G56789", address: "88 Sauchiehall Street, Flat 2/1, Glasgow, G2 3DH", photos: 2, report: true },
  { ref: "G67890", address: "14 Kelvingrove Street, Glasgow, G3 7RN", photos: 1, report: true },
  { ref: "FK12345", address: "3 Ochil View, Stirling, FK8 2QY", photos: 2, report: false },
];

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!buckets.some((b) => b.name === BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createError) throw createError;
    console.log(`Created public bucket "${BUCKET}"`);
  }
}

async function upload(path, bytes, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function main() {
  await ensureBucket();
  const urls = { photos: {}, reports: {} };

  for (const property of PROPERTIES) {
    const photoUrls = [];
    for (let i = 0; i < property.photos; i++) {
      const path = `photos/${property.ref.toLowerCase()}-${i + 1}.svg`;
      const svg = houseSvg(property.address, "Photo Pending");
      const url = await upload(path, new TextEncoder().encode(svg), "image/svg+xml");
      photoUrls.push(url);
      console.log(`photo  ${property.ref} [${i}] -> ${url}`);
    }
    if (photoUrls.length > 0) urls.photos[property.ref] = photoUrls;

    if (property.report) {
      const path = `reports/${property.ref.toLowerCase()}.pdf`;
      const pdfBytes = await generateReportPdf(property.ref, property.address);
      const url = await upload(path, pdfBytes, "application/pdf");
      urls.reports[property.ref] = url;
      console.log(`report ${property.ref} -> ${url}`);
    }
  }

  console.log("\n--- JSON summary ---");
  console.log(JSON.stringify(urls, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
