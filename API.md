# API Reference — PropTune Demo CRM

Base path `/api/v1`. Auth: `x-api-key` header on every request.
All writes accept `Idempotency-Key` (use the Vapi call ID).
Never expose UUIDs for properties — use `ref`.

---

## Contacts

```
GET    /contacts?phone=            ← most important endpoint in the system
GET    /contacts?q=                full-text
GET    /contacts/:id
POST   /contacts                   upsert on phone_primary
PATCH  /contacts/:id
```

## Properties

```
GET    /properties?postcode=&min_price=&max_price=&beds=&type=&status=&listing_type=&cursor=
GET    /properties/:ref
GET    /properties/:ref/viewing-arrangement
GET    /properties/:ref/notes      UI only
POST   /properties                 UI only — onboards a new listing
PATCH  /properties/:ref            UI only — full listing edit
```

`listing_type` is `sales` | `lettings` — a property is one or the other, never both.
Lettings properties carry `rent_amount`/`rent_frequency` (`monthly` | `weekly`) instead
of `asking_price`/`price_qualifier`/`home_report_*`, and use `on_market` | `let` instead
of the sales status vocabulary.

`POST /properties` assigns `ref` automatically (outward postcode + a random 5-digit
number) — never pass a uuid, and there's no way to choose your own ref.

`GET /properties/:ref/viewing-arrangement` returns:

```json
{
  "ref": "EH12345",
  "conducted_by": "vendor",
  "viewing_notes": "Owner works shifts, evenings after 6 usually fine, never Sundays.",
  "can_commit": false,
  "free_slots": []
}
```

For `viewing_agent` / `agency_staff`: `can_commit: true` and `free_slots` populated
from Google Calendar.

## Valuations

```
GET    /valuations?phone=
POST   /valuations
PATCH  /valuations/:id
```

## Viewings

```
GET    /viewings?phone=&property_ref=&from=&to=
POST   /viewings
PATCH  /viewings/:id               confirm | cancel | reschedule
POST   /viewings/:id/feedback      writes a note against the viewing
```

`POST /viewings` branches on `viewing_conducted_by`:
vendor → `requested` + `proposed_times` + task; agent-led → calendar event + `confirmed`.

## Offers and notes of interest

One table, one set of endpoints. `type` distinguishes them.

```
GET    /offers?property_ref=&phone=&type=
POST   /offers
PATCH  /offers/:id                 including note_of_interest → offer upgrade
POST   /offers/:id/accept
POST   /offers/:id/reject
POST   /offers/:id/counter
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
Accept, reject and counter apply to `offer` only.

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
GET    /tasks?assignee=&status=
POST   /tasks
```

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
| `get_property` | `GET /properties/:ref` |
| `get_viewing_arrangement` | `GET /properties/:ref/viewing-arrangement` |
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
