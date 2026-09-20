// Seeds the fixed set of records the Wilson booking-agent tests run against
// (book / move / cancel a viewing, driven from n8n with simulated callers).
//
//   node scripts/seed-wilson-tests.mjs                # reset, then recreate
//   node scripts/seed-wilson-tests.mjs --reset-only   # reset, recreate nothing
//
// Writes straight to Postgres with the service key rather than going through
// /api/v1, for one reason: several rows here have to be backdated ("created 4
// days ago", "dated yesterday") and every write endpoint stamps created_at
// with now(). Verification at the end goes back through the public API, so
// what gets checked is what n8n will actually see.
//
// Idempotent by design. Test contacts are identified by phone number, never
// by id, because the agent creates some of them mid-test and their ids differ
// on every run. Everything hanging off those contacts is removed before
// anything is recreated, so repeated runs converge on the same state.
//
// Nothing outside the record set below is touched. The one exception is
// explicit, guarded and authorised: RELOCATE moves a single pre-existing
// contact off a number this fixture needs.

import { createClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const RESET_ONLY = process.argv.includes("--reset-only");
const ZONE = "Europe/London";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const eq = line.indexOf("=");
      if (eq === -1 || line.trimStart().startsWith("#")) continue;
      const key = line.slice(0, eq).trim();
      if (!env[key]) env[key] = line.slice(eq + 1).trim();
    }
  } catch {
    // .env.local is optional — CI can supply the same vars directly.
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY;
const API_BASE = env.SEED_API_BASE ?? "https://demo.proptune.co.uk";
const API_KEY = env.API_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env.local or environment)");
}

const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// ---------------------------------------------------------------------------
// The record set
// ---------------------------------------------------------------------------

// Contacts the agent itself creates during a test run. Deleted every run so
// each test starts with the number genuinely absent from the CRM.
const DELETE_ONLY = [
  { name: "Eilidh Munro", phone: "+447700900301" },
  { name: "Lewis Paterson", phone: "+447700900401" },
  { name: "Hannah Doig", phone: "+447700900402" },
  { name: "Callum Nisbet", phone: "+447700900403" },
  { name: "Ailsa Reid", phone: "+447700900404" },
  { name: "Duncan Muir", phone: "+447700900405" },
  { name: "Morag Stewart", phone: "+447700900406" },
];

const CREATE = [
  { key: "moira", name: "Moira Kennedy", phone: "+447700900302" },
  { key: "andrew", name: "Andrew Sutherland", phone: "+447700900303" },
  { key: "laura", name: "Laura Findlay", phone: "+447700900304" },
  { key: "kirsty", name: "Kirsty Ogilvie", phone: "+447700900305" },
  { key: "ruaridh", name: "Ruaridh MacLeod", phone: "+447700900306" },
  { key: "iain", name: "Iain Robertson", phone: "+447700900307" },
  { key: "fraser", name: "Fraser Cowan", phone: "+447700900308" },
  { key: "shona", name: "Shona Blair", phone: "+447700900309" },
  { key: "graeme", name: "Graeme Tait", phone: "+447700900390" },
];

function emailFor(name) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

// +447700900303 belonged to Aisha Farooq, an original demo contact holding an
// open offer on EH12345. She keeps her record, her offer and her history —
// only the number moves, so Andrew Sutherland can hold the number the test
// scenarios are written against. Guarded on the name: if anyone else is on
// that number, the script stops rather than rewriting a stranger's record.
const RELOCATE = {
  expectName: "Aisha Farooq",
  fromPhone: "+447700900303",
  toPhone: "+447700900310",
};

// `GENERAL:` is read out of properties.viewing_notes by the n8n Get Viewing
// Context workflow. Appended to the existing bullets, never replacing them —
// the `viewing_vendor` / `viewing_agent` markers on the first line are what
// decides the viewing route, so they must survive untouched.
const GENERAL_LINES = {
  EH12345: ["GENERAL: weekday evenings after 5.30pm", "GENERAL: Saturday mornings"],
  EH11656: ["GENERAL: weekday afternoons", "GENERAL: weekend mornings"],
  EH45678: ["GENERAL: weekday mornings before 11am"],
};

// `AVAILABLE:` is read from dated property notes. Matched on exact body text
// for replacement — deliberately carrying no seed marker, since an invisible
// tag could end up inside the value the workflow parses off the line.
// EH67890 gets none: it's agent-led, its slots come from the viewing agent's
// calendar, which this CRM doesn't model.
const AVAILABLE_NOTES = [
  { ref: "EH45678", body: "AVAILABLE: Sunday 1pm to 4pm", daysAgo: 3 },
  { ref: "EH11656", body: "AVAILABLE: Monday afternoon", daysAgo: 2 },
];

const PROPERTY_REFS = ["EH67890", "EH12345", "EH11656", "EH45678"];

// ---------------------------------------------------------------------------
// Dates — computed per run so the fixture never goes stale
// ---------------------------------------------------------------------------

const now = DateTime.now().setZone(ZONE);

// "The coming Thursday" = the next Thursday at least two days out, so a test
// booking never lands too close to today to be moved or cancelled.
const WEEKDAYS = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

function coming(day, hour, minute = 0) {
  let date = now.startOf("day").plus({ days: 2 });
  while (date.weekday !== WEEKDAYS[day]) date = date.plus({ days: 1 });
  return date.set({ hour, minute });
}

function daysAgo(n) {
  return now.minus({ days: n });
}

// Luxon resolves the BST/GMT offset for us, so 6pm local is stored as 17:00Z
// through the summer and 18:00Z after the October clock change.
const utc = (dt) => dt.toUTC().toISO({ suppressMilliseconds: true });

const DATES = {
  graeme_wed_6pm: coming("wed", 18),
  andrew_thu_2pm: coming("thu", 14),
  laura_sat_11am: coming("sat", 11),
  ruaridh_thu_7pm: coming("thu", 19),
  fraser_tue_10am: coming("tue", 10),
  shona_fri_3pm: coming("fri", 15),
};

// ---------------------------------------------------------------------------
// Phone matching — mirrors lib/api/phone.ts
// ---------------------------------------------------------------------------

// Reimplemented rather than imported: that module is TypeScript and this is a
// plain .mjs script run straight through node. Kept deliberately identical so
// a contact this script deletes is exactly the one the API would have found.
function normalizePhone(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("44") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function phonesMatch(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na === "" || nb === "") return false;
  if (na.length < 7 || nb.length < 7) return na === nb;
  return na.slice(-10) === nb.slice(-10);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function check(error, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

async function allContacts() {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("contacts")
      .select("id, name, phone_primary")
      .range(from, from + PAGE - 1);
    check(error, "read contacts");
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function propertiesByRef() {
  const { data, error } = await db
    .from("properties")
    .select("id, ref, status, viewing_notes")
    .in("ref", PROPERTY_REFS);
  check(error, "read properties");
  return Object.fromEntries((data ?? []).map((p) => [p.ref, p]));
}

const log = (...args) => console.log(...args);

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

const ALL_SEED_PHONES = [...DELETE_ONLY, ...CREATE].map((c) => c.phone);

async function reset(agencyId, properties) {
  const contacts = await allContacts();
  const targets = contacts
    .filter((c) => ALL_SEED_PHONES.some((phone) => phonesMatch(c.phone_primary, phone)))
    // Belt and braces alongside running relocateConflict() first: the
    // relocated contact is a real demo record that happened to hold a seed
    // number, and must never be caught by a phone-matched delete. Getting
    // this order wrong once already cost her record, her offer and a viewing.
    .filter((c) => c.name !== RELOCATE.expectName);
  const ids = targets.map((c) => c.id);

  if (ids.length > 0) {
    // A seed contact must never be a property's vendor — if one somehow is,
    // deleting it would break that listing, so stop instead.
    const { data: asVendor, error: vendorError } = await db
      .from("properties")
      .select("ref")
      .in("vendor_contact_id", ids);
    check(vendorError, "check vendor links");
    if (asVendor && asVendor.length > 0) {
      throw new Error(
        `Refusing to delete: seed contact is vendor on ${asVendor.map((p) => p.ref).join(", ")}`
      );
    }

    const { data: viewings, error: viewingsError } = await db
      .from("viewings")
      .select("id")
      .in("contact_id", ids);
    check(viewingsError, "read viewings");
    const viewingIds = (viewings ?? []).map((v) => v.id);

    const { data: offers, error: offersError } = await db
      .from("offers")
      .select("id")
      .or(`contact_id.in.(${ids.join(",")}),solicitor_contact_id.in.(${ids.join(",")})`);
    check(offersError, "read offers");
    const offerIds = (offers ?? []).map((o) => o.id);

    const { data: valuations, error: valuationsError } = await db
      .from("valuations")
      .select("id")
      .in("contact_id", ids);
    check(valuationsError, "read valuations");
    const valuationIds = (valuations ?? []).map((v) => v.id);

    const { data: issues, error: issuesError } = await db
      .from("maintenance_issues")
      .select("id")
      .in("contact_id", ids);
    check(issuesError, "read maintenance issues");
    const issueIds = (issues ?? []).map((i) => i.id);

    // Notes and tasks are polymorphic, so each entity type is cleared by the
    // ids collected above — viewing feedback included.
    const noteTargets = [
      ["contact", ids],
      ["viewing", viewingIds],
      ["offer", offerIds],
      ["valuation", valuationIds],
      ["maintenance_issue", issueIds],
    ];
    for (const [entityType, entityIds] of noteTargets) {
      if (entityIds.length === 0) continue;
      check(
        (await db.from("notes").delete().eq("entity_type", entityType).in("entity_id", entityIds))
          .error,
        `delete ${entityType} notes`
      );
      check(
        (await db.from("tasks").delete().eq("entity_type", entityType).in("entity_id", entityIds))
          .error,
        `delete ${entityType} tasks`
      );
    }

    if (offerIds.length > 0) {
      check((await db.from("offer_contacts").delete().in("offer_id", offerIds)).error, "offer_contacts");
      check((await db.from("offers").delete().in("id", offerIds)).error, "delete offers");
    }
    check((await db.from("offer_contacts").delete().in("contact_id", ids)).error, "offer_contacts by contact");
    if (viewingIds.length > 0) {
      check((await db.from("viewings").delete().in("id", viewingIds)).error, "delete viewings");
    }
    if (valuationIds.length > 0) {
      check((await db.from("valuations").delete().in("id", valuationIds)).error, "delete valuations");
    }
    if (issueIds.length > 0) {
      check((await db.from("maintenance_issues").delete().in("id", issueIds)).error, "delete issues");
    }
    check((await db.from("vendor_contacts").delete().in("contact_id", ids)).error, "vendor_contacts");
    check((await db.from("property_contacts").delete().in("contact_id", ids)).error, "property_contacts");
    check((await db.from("contacts").delete().in("id", ids)).error, "delete contacts");

    log(`  removed ${ids.length} test contact(s): ${targets.map((t) => t.name).join(", ")}`);
    log(
      `  removed ${viewingIds.length} viewing(s), ${offerIds.length} offer(s), ` +
        `${valuationIds.length} valuation(s), ${issueIds.length} maintenance issue(s) and their notes`
    );
  } else {
    log("  no test contacts present");
  }

  // AVAILABLE: notes, matched on exact body so re-runs replace rather than stack.
  for (const note of AVAILABLE_NOTES) {
    const property = properties[note.ref];
    if (!property) continue;
    check(
      (
        await db
          .from("notes")
          .delete()
          .eq("entity_type", "property")
          .eq("entity_id", property.id)
          .eq("body", note.body)
      ).error,
      `delete AVAILABLE note on ${note.ref}`
    );
  }

  // GENERAL: lines are stripped here and re-appended by seed(), which keeps
  // the file's own lines from ever appearing twice.
  for (const [ref, lines] of Object.entries(GENERAL_LINES)) {
    const property = properties[ref];
    if (!property) continue;
    const kept = (property.viewing_notes ?? "")
      .split("\n")
      .filter((line) => !lines.some((managed) => line.trim().toLowerCase() === managed.toLowerCase()));
    const next = kept.join("\n").replace(/\n+$/, "");
    if (next !== (property.viewing_notes ?? "")) {
      check(
        (await db.from("properties").update({ viewing_notes: next }).eq("id", property.id)).error,
        `strip GENERAL lines on ${ref}`
      );
    }
    property.viewing_notes = next;
  }

  log("  cleared AVAILABLE notes and GENERAL lines");
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function relocateConflict() {
  const contacts = await allContacts();
  const onTarget = contacts.find((c) => phonesMatch(c.phone_primary, RELOCATE.toPhone));
  const onSource = contacts.find((c) => phonesMatch(c.phone_primary, RELOCATE.fromPhone));

  if (onTarget && onTarget.name === RELOCATE.expectName) {
    log(`  ${RELOCATE.expectName} already on ${RELOCATE.toPhone}`);
    return;
  }
  if (onTarget) {
    throw new Error(`${RELOCATE.toPhone} is held by ${onTarget.name} — resolve before seeding`);
  }
  if (!onSource) return;
  if (onSource.name !== RELOCATE.expectName) {
    throw new Error(
      `${RELOCATE.fromPhone} is held by ${onSource.name}, not ${RELOCATE.expectName} — refusing to move`
    );
  }

  check(
    (await db.from("contacts").update({ phone_primary: RELOCATE.toPhone }).eq("id", onSource.id))
      .error,
    "relocate conflicting contact"
  );
  log(`  moved ${RELOCATE.expectName} from ${RELOCATE.fromPhone} to ${RELOCATE.toPhone}`);
}

async function seed(agencyId, properties) {
  const rows = CREATE.map((c) => ({
    agency_id: agencyId,
    name: c.name,
    roles: ["buyer"],
    phone_primary: c.phone,
    email: emailFor(c.name),
  }));
  const { data: created, error } = await db.from("contacts").insert(rows).select("id, name");
  check(error, "create contacts");

  const contactId = {};
  for (const c of CREATE) {
    contactId[c.key] = created.find((row) => row.name === c.name).id;
  }
  log(`  created ${created.length} contacts`);

  // status mapping:
  //   confirmed -> confirmed        scheduled_at + a stamped calendar event
  //   pending   -> incomplete       no time at all, as Create Enquiry leaves it
  //   proposed  -> requested        the owner's time sits in proposed_times
  const viewingRows = [
    {
      key: "graeme",
      ref: "EH12345",
      contact: "graeme",
      status: "confirmed",
      scheduled_at: utc(DATES.graeme_wed_6pm),
    },
    {
      key: "andrew",
      ref: "EH11656",
      contact: "andrew",
      status: "confirmed",
      scheduled_at: utc(DATES.andrew_thu_2pm),
    },
    {
      key: "laura",
      ref: "EH45678",
      contact: "laura",
      status: "confirmed",
      scheduled_at: utc(DATES.laura_sat_11am),
    },
    {
      key: "kirsty",
      ref: "EH12345",
      contact: "kirsty",
      status: "incomplete",
      created_at: utc(daysAgo(4)),
      feedback: {
        body: "Buyer can do weekday evenings or Saturday morning.",
        created_at: utc(daysAgo(4)),
      },
    },
    {
      key: "ruaridh",
      ref: "EH11656",
      contact: "ruaridh",
      status: "requested",
      proposed_times: [utc(DATES.ruaridh_thu_7pm)],
      feedback: { body: "Owner has proposed Thursday at 7pm.", created_at: utc(daysAgo(1)) },
    },
    {
      key: "fraser",
      ref: "EH12345",
      contact: "fraser",
      status: "requested",
      proposed_times: [utc(DATES.fraser_tue_10am)],
      feedback: { body: "Owner has proposed Tuesday at 10am.", created_at: utc(daysAgo(1)) },
    },
    {
      key: "shona",
      ref: "EH67890",
      contact: "shona",
      status: "confirmed",
      scheduled_at: utc(DATES.shona_fri_3pm),
    },
  ];

  const viewingId = {};
  for (const row of viewingRows) {
    const insert = {
      agency_id: agencyId,
      property_id: properties[row.ref].id,
      contact_id: contactId[row.contact],
      status: row.status,
      scheduled_at: row.scheduled_at ?? null,
      proposed_times: row.proposed_times ?? null,
      // Matches what POST /viewings stamps when it commits a slot.
      calendar_event_id: row.status === "confirmed" ? `demo-${randomUUID()}` : null,
    };
    if (row.created_at) insert.created_at = row.created_at;

    const { data, error: viewingError } = await db.from("viewings").insert(insert).select("id").single();
    check(viewingError, `create ${row.key} viewing`);
    viewingId[row.key] = data.id;

    if (row.feedback) {
      // Same row POST /viewings/:id/feedback writes, so the agent's Log
      // Viewing Note tool reads these back unchanged.
      check(
        (
          await db.from("notes").insert({
            agency_id: agencyId,
            entity_type: "viewing",
            entity_id: data.id,
            author_type: "user",
            body: row.feedback.body,
            created_at: row.feedback.created_at,
          })
        ).error,
        `create ${row.key} feedback note`
      );
    }
  }
  log(`  created ${viewingRows.length} viewings and their feedback notes`);

  for (const [ref, lines] of Object.entries(GENERAL_LINES)) {
    const property = properties[ref];
    const existing = (property.viewing_notes ?? "").replace(/\n+$/, "");
    const next = [existing, ...lines].filter(Boolean).join("\n");
    check(
      (await db.from("properties").update({ viewing_notes: next }).eq("id", property.id)).error,
      `append GENERAL lines on ${ref}`
    );
  }

  for (const note of AVAILABLE_NOTES) {
    check(
      (
        await db.from("notes").insert({
          agency_id: agencyId,
          entity_type: "property",
          entity_id: properties[note.ref].id,
          author_type: "user",
          body: note.body,
          created_at: utc(daysAgo(note.daysAgo)),
        })
      ).error,
      `create AVAILABLE note on ${note.ref}`
    );
  }
  log("  appended GENERAL lines and added AVAILABLE notes");

  return { contactId, viewingId };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const { data: agency, error: agencyError } = await db
  .from("agencies")
  .select("id")
  .limit(1)
  .single();
check(agencyError, "read agency");

const properties = await propertiesByRef();
for (const ref of PROPERTY_REFS) {
  if (!properties[ref]) throw new Error(`Property ${ref} not found — aborting`);
}

// Must run before reset(): while the conflicting contact still holds a seed
// phone number, a phone-matched delete would sweep her up instead of moving
// her. Runs on --reset-only too, so the number stays free either way.
await relocateConflict();

log(RESET_ONLY ? "Resetting (no recreate)…" : "Resetting…");
await reset(agency.id, properties);

if (RESET_ONLY) {
  log("\nReset complete. Nothing recreated (--reset-only).");
  process.exit(0);
}

log("Seeding…");
const { contactId, viewingId } = await seed(agency.id, properties);

const output = {
  SEED_SLB02_CONTACT_ID: contactId.moira,
  SEED_IAIN_CONTACT_ID: contactId.iain,
  SEED_ANDREW_CONTACT_ID: contactId.andrew,
  SEED_SLB03_VIEWING_ID: viewingId.andrew,
  SEED_LAURA_CONTACT_ID: contactId.laura,
  SEED_SLB04_VIEWING_ID: viewingId.laura,
  SEED_SLB05_VIEWING_ID: viewingId.kirsty,
  SEED_RUARIDH_CONTACT_ID: contactId.ruaridh,
  SEED_SLB06_VIEWING_ID: viewingId.ruaridh,
  SEED_FRASER_CONTACT_ID: contactId.fraser,
  SEED_FRASER_VIEWING_ID: viewingId.fraser,
  SEED_SHONA_CONTACT_ID: contactId.shona,
  SEED_SHONA_VIEWING_ID: viewingId.shona,
  status_mapping: { confirmed: "confirmed", pending: "incomplete", proposed: "requested" },
  dates_used: Object.fromEntries(
    Object.entries(DATES).map(([key, dt]) => [key, dt.toISO({ suppressMilliseconds: true })])
  ),
};

log("\n" + JSON.stringify(output, null, 2));

// Extra ids that aren't in the required output but save a lookup.
log(
  "\nAlso created: " +
    ["graeme", "kirsty", "shona", "moira"]
      .map((k) => `${k}=${contactId[k]}`)
      .join("  ") +
    `  graeme_viewing=${viewingId.graeme}`
);

if (API_KEY) {
  log(`\nVerifying through ${API_BASE} …`);
  const api = async (path) => {
    const response = await fetch(`${API_BASE}${path}`, { headers: { "x-api-key": API_KEY } });
    return { status: response.status, body: await response.json() };
  };

  for (const ref of PROPERTY_REFS) {
    const { body } = await api(`/api/v1/properties/${ref}/viewings`);
    log(`\nGET /properties/${ref}/viewings`);
    for (const v of body.viewings ?? []) {
      log(`  ${v.status.padEnd(10)} ${String(v.scheduled_at ?? "—").padEnd(27)} ${v.viewing_id}`);
    }
  }

  for (const ref of ["EH12345", "EH11656", "EH45678"]) {
    const { body } = await api(`/api/v1/properties/${ref}/notes`);
    log(`\nGET /properties/${ref}/notes`);
    for (const n of body.notes ?? []) log(`  ${n.created_at.slice(0, 10)}  ${n.body}`);
  }

  const andrew = await api("/api/v1/contacts?phone=7700900303");
  log(
    `\nGET /contacts?phone=7700900303 -> ${andrew.body.contacts?.length ?? 0} contact(s): ` +
      (andrew.body.contacts ?? []).map((c) => c.name).join(", ")
  );

  const absent = await api("/api/v1/contacts?phone=7700900401");
  log(`GET /contacts?phone=7700900401 -> ${absent.body.contacts?.length ?? 0} contact(s)`);
}
