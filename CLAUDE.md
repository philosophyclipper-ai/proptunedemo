# CLAUDE.md — PropTune Demo CRM

A demo Scottish estate agency CRM. API-first. Exists to showcase PropTune voice agents
and to develop n8n integration patterns that port to real client CRMs (Reapit, Alto,
Jupix, Street, Rex).

It is not a product, will not be sold or hosted for clients, and has no users.

## Stack

Next.js App Router + TypeScript · Supabase Postgres (EU, demo-only project) ·
Supabase Storage · Tailwind · deployed to Cloudflare Workers.

No separate backend. No Redis, queues, websockets, or search engine.

## Hard rules

- **No AI logic in this repo. Ever.** No LLM calls, no prompt handling, no `/ai/*` or
  `/voice/*` endpoints. Orchestration lives in n8n and Vapi.
- If it wouldn't plausibly exist in Alto or Reapit, it doesn't belong here.
- All routes under `/api/v1`. Auth is a static `x-api-key` header. No JWT, no login.
- Every table carries `agency_id`, even though there is one agency.
- `ref` (e.g. `EH12345`) is the public property identifier. Never expose UUIDs.
- All writes accept an `Idempotency-Key` header and are idempotent.
- Voice-facing responses are lean: flat objects, one level of nesting max, no fields
  the agent won't speak aloud.
- **Notes are read by humans, not parsed by machines.** Nothing in a workflow makes a
  decision by reading a note. If a workflow must act on it, it's a structured column.

## Tables

`agencies` · `users` · `contacts` · `properties` · `property_photos` · `valuations` ·
`viewings` · `offers` · `maintenance_issues` · `notes` · `tasks`

Plus `timeline`, a **view** (union of notes, viewings, valuations, offers, tasks,
maintenance) — never written to, never queried by a voice agent.

### Conventions

- **Contacts is one table, not four.** `roles text[]` = vendor | landlord | buyer |
  tenant | applicant | solicitor. A contact commonly holds several at once.
- **Offers covers notes of interest.** `offers.type` = `note_of_interest` | `offer`.
  A note of interest has a null `amount`; an offer requires one. Same table, same
  workflow, and a note of interest can be upgraded in place.
- **Valuations may have no property** — they exist pre-instruction, so they carry their
  own address fields.
- **`notes` is polymorphic** (`entity_type`, `entity_id`) and is the system's memory.
  Viewing feedback, post-call summaries, email recaps and negotiator commentary all land
  here. `author_type` = `user` | `ai`.
- **`tasks` is the escape hatch.** When an agent can't complete something, it writes a
  task rather than failing.

## Scotland-specific

- Two prices: `home_report_value` and `asking_price`, plus `price_qualifier`
  (offers_over | fixed_price | offers_around | offers_in_region_of | poa).
- Notes of interest are the highest-frequency call outcome — the easiest thing the
  agent does.
- `properties.closing_date` is set by humans only, never by an agent.
- Solicitor is a **role on contacts**. `offers` carries an optional
  `solicitor_contact_id`. Offers do not require a solicitor.
- Tenure includes `feuhold`.

## Viewing arrangement

There is no availability table. Scottish agencies don't hold structured availability.

`properties.viewing_conducted_by` = `vendor` | `viewing_agent` | `agency_staff`.

- **vendor** → no calendar exists. Constraints live as free text in
  `properties.viewing_notes`. The agent *proposes* times: the viewing is created as
  `requested` with `proposed_times`, plus a task for the negotiator.
- **viewing_agent / agency_staff** → availability lives in Google Calendar
  (`viewing_calendar_id`). The agent *commits*: creates the event, viewing is `confirmed`.

`GET /properties/:ref/viewing-arrangement` serves both; the agent branches on the response.

`viewing_notes` is unparseable by design. Seed data must include messy examples.

## How a call is recorded

There is no call log table — estate agency CRMs don't have one.

The agent does the real work during the call (viewing, offer, maintenance issue), then
writes a short summary note against the contact before hanging up. Vapi keeps the
recording and transcript; this CRM keeps the human-readable line.

A negotiator opening a contact should see something like:

> *AI · Tue 4:12pm — Booked viewing at 14 Rose Street, Thursday 2pm. Cash buyer,
> no chain, sold subject to missives.*

The same notes field is used by staff after a viewing or an email exchange, so one
timeline covers everything regardless of who or what created it.

## Deliberate imperfections

Real CRMs aren't tidy. Keep these:

- Cursor pagination on `GET /properties` and `GET /contacts` (20/page)
- Nulls where data is expected (missing `home_report_url`, `council_tax_band`)

## Out of scope

Matching engine · rental applications & referencing · reporting endpoints · contact merge
& dedupe · portal integrations · outbound email/SMS/WhatsApp · auth & roles · document
storage · floorplan/EPC upload flows.

## Definition of done for any endpoint

Curl-tested with and without the API key · idempotency verified on writes · response
shape reviewed for voice-agent brevity.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
