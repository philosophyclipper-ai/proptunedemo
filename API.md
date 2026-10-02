# API Reference — PropTune Demo CRM

Base path `/api/v1`. Auth: `x-api-key` header on every request.
All writes accept `Idempotency-Key` (use the Vapi call ID).
Never expose UUIDs for properties — use `ref`.

---

## Contacts

```
GET    /contacts?phone=            ← most important endpoint in the system
GET    /contacts?email=            exact address, case-insensitive
GET    /contacts?q=                full-text
GET    /contacts/:id
POST   /contacts                   upsert on phone_primary
PATCH  /contacts/:id
```

`phone` matches however the number is written (`+447700900202`, `07700900202`,
`07700 900202`) and looks in `phone_primary`, `phone_secondary` and
`additional_numbers`. That matching runs in Postgres — `contacts_by_phone`,
migration 0049 — so the lookup returns the matches rather than the table.
`email` is an exact address; use `q` for partials.

`POST /contacts` matches on phone **and name**. The same name on a number
already on file updates that contact; a different name creates a separate
record and flags both with `probable_duplicate` and `duplicate_of`. A phone
number is not an identity — two people share a landline, and a buyer ringing
from a number on file as a seller must not overwrite the seller.

## Properties

```
GET    /properties?postcode=&q=&min_price=&max_price=&beds=&type=&status=&listing_type=&cursor=
GET    /properties/:ref
GET    /properties/:ref/notes      UI only
GET    /properties/:ref/vendors    UI only
POST   /properties                 UI only — onboards a new listing
POST   /properties/:ref/vendors    UI only — attach a contact as a seller
DELETE /properties/:ref/vendors/:contact_id   UI only — detach one
PATCH  /properties/:ref            UI only — full listing edit
```

A property can be sold by more than one person, which `vendor_contact_id` has no
way to express — the vendors routes edit the `vendors`/`vendor_contacts` record
that `contacts/resolve` and `embed=vendors` actually read. `vendor_contact_id`
stays mirrored to the first contact on that record, so existing n8n flows keep
working; removing that contact repoints it at whoever remains, or nulls it.
Detaching a vendor never deletes the contact — they may be a buyer elsewhere.

`q` is a free-text search across address line 1/2, postcode and city (UI search bar) —
`postcode` remains a dedicated prefix match, used separately by voice search.

`listing_type` is `sales` | `lettings` — a property is one or the other, never both.
Lettings properties carry `rent_amount`/`rent_frequency` (`monthly` | `weekly`) instead
of `asking_price`/`price_qualifier`/`home_report_*`, and use `on_market` | `let` instead
of the sales status vocabulary.

`POST /properties` assigns `ref` automatically (outward postcode + a random 5-digit
number) — never pass a uuid, and there's no way to choose your own ref.

There is deliberately no structured field for who conducts viewings, whether a
calendar exists, or general availability — real CRMs don't hand an integration a
clean flag for this, and neither does this one. `properties.viewing_notes` is a
single free-text field (returned on the property object, editable via `PATCH
/properties/:ref`) covering all of it: who shows the property, when they're
generally free, and any access notes — typically a few bullet points. Whoever's
booking (staff or an AI agent) reads it and decides whether to propose times or
commit one directly; see `POST /viewings` below.

## Valuations

```
GET    /valuations?phone=
POST   /valuations
PATCH  /valuations/:id
```

## Viewings

```
GET    /viewings?phone=&contact_id=&property_ref=&from=&to=
GET    /viewings/:id
POST   /viewings
PATCH  /viewings/:id               confirm | cancel | reschedule, OR direct field edit — UI only
POST   /viewings/:id/feedback      appends a note against the viewing
```

Filters combine: `contact_id` with `property_ref` answers "this buyer's viewings
at this property". `phone` resolves to a contact using the same matching as
`GET /contacts?phone=`, so both agree about whose number it is.

**Notes and feedback are different things.** Notes are the running log against a
viewing — times proposed, chased, relayed — and **append**. Write them with
`POST /viewings/:id/feedback` (named that way historically, and what existing
workflows post to) or the equivalent `POST /notes` with
`entity_type: "viewing"`; both land in the same place and show as "Notes"
inside the viewing record.

`feedback` is a single value on the viewing — how it actually went — set with
`PATCH /viewings/:id` and **replaced** on each write. It's the one thing shown
on the property page under that viewing, so a vendor-facing summary isn't
buried in the log.

Saving feedback also **completes the viewing**. The lifecycle is:

```
confirmed --(scheduled_at passes, nightly sweep)--> awaiting_feedback
awaiting_feedback --(feedback saved)--> completed
```

So `completed` means the outcome is known, not merely that the date passed, and
`awaiting_feedback` is the chase list. Clearing feedback puts a viewing back to
`awaiting_feedback`, so a mistaken entry can be undone. Cancelled viewings never
move — they didn't happen, so there's nothing to report.

`POST /viewings` branches on which fields the caller sends, not any property flag:
send `proposed_times` (no `scheduled_at`) → `requested` + a follow-up task is created;
send `scheduled_at` → `confirmed` directly, with a calendar event stamped. Send neither
and it's created `incomplete` — add a time later via `PATCH /viewings/:id`.

`PATCH /viewings/:id` has two shapes: send `action` (confirm/cancel/reschedule) for the
voice-tool contract, or omit it and set `status`/`scheduled_at`/`proposed_times`/
`mortgage_status`/`buyer_property_status` directly — UI editing only, never a voice tool.

## Offers and notes of interest

One table, one set of endpoints. `type` distinguishes them. A couple or multiple
applicants on one offer are additional contacts, not a second offer row.

```
GET    /offers?property_ref=&phone=&type=
POST   /offers
PATCH  /offers/:id                 including note_of_interest → offer upgrade
POST   /offers/:id/accept
POST   /offers/:id/reject
POST   /offers/:id/contacts        UI only — attach an additional contact
```

```json
POST /offers
{
  "property_ref": "EH12345",
  "contact_id": "...",
  "type": "note_of_interest",
  "amount": null,
  "solicitor_contact_id": null,
  "received_via": "ai_voice"
}
```

`amount` is null for `note_of_interest` and required for `offer`.
Accept and reject apply to `offer` only. There is no counter-offer status or
endpoint — that step doesn't exist in the Scottish system; offers stay `open`
until accepted, rejected or withdrawn.

## Maintenance

```
GET    /maintenance?phone=&property_ref=
POST   /maintenance
PATCH  /maintenance/:id
```

## Notes and tasks

```
GET    /notes?entity_type=&entity_id=
POST   /notes                      contact summaries, viewing feedback, staff commentary
PATCH  /notes/:id                  UI only — correct the wording of a note
DELETE /notes/:id                  UI only — remove a note
GET    /tasks?assignee=&status=
POST   /tasks
```

Editing and deleting notes are UI only and deliberately not voice tools: an agent
that can rewrite or remove what it (or a colleague) already wrote fails far worse
than one that can only add. `DELETE` is idempotent — removing an already-removed
note reports the same result rather than erroring.

```json
POST /notes
{
  "entity_type": "contact",
  "entity_id": "...",
  "author_type": "ai",
  "body": "Booked viewing at 14 Rose Street, Thursday 2pm. Cash buyer, no chain."
}
```

## Timeline and users

```
GET    /timeline/contact/:id       UI only
GET    /timeline/property/:id      UI only
GET    /users
```

---

## Voice agent tool set

Only these are exposed to Vapi.

| Tool | Endpoint |
|---|---|
| `find_contact_by_phone` | `GET /contacts?phone=` |
| `create_contact` | `POST /contacts` |
| `search_properties` | `GET /properties?...` |
| `get_property` | `GET /properties/:ref` (includes `viewing_notes`) |
| `book_or_request_viewing` | `POST /viewings` |
| `find_viewings` | `GET /viewings?phone=` |
| `cancel_or_reschedule_viewing` | `PATCH /viewings/:id` |
| `book_valuation` | `POST /valuations` |
| `register_interest_or_offer` | `POST /offers` |
| `report_maintenance_issue` | `POST /maintenance` |
| `add_contact_note` | `POST /notes` |
| `create_task` | `POST /tasks` |

`add_contact_note` is called once at the end of every call, not chosen between — it
isn't competing with the others for selection.

`create_task` is the fallback for anything the agent can't complete.

Everything else in this document is for the CRM UI.

---

## Error shape

```json
{ "error": { "code": "not_found", "message": "No property with ref EH99999" } }
```

Codes: `unauthorized` · `not_found` · `validation_failed` · `conflict` · `rate_limited`.

Messages must be readable aloud — a voice agent may relay them.
