# PropTune Demo CRM

A demo Scottish estate agency CRM. API-first, built to showcase PropTune voice
agents and to develop n8n integration patterns that port to real client CRMs
(Reapit, Alto, Jupix, Street, Rex). Not a product — no users, not hosted for
clients. See [CLAUDE.md](CLAUDE.md) for the full domain spec and
[API.md](API.md) for the endpoint reference.

Next.js App Router + TypeScript, Supabase Postgres, deployed to Vercel.

## Running locally

```
npm install
cp .env.example .env.local   # fill in SUPABASE_URL, SUPABASE_SECRET_KEY, API_KEY
npm run dev
```

`SUPABASE_URL` and `SUPABASE_SECRET_KEY` come from your Supabase project's
**Connect** dialog (API section). `API_KEY` is any string you choose — it's
the static value every request must send as `x-api-key`.

All API routes are curl-testable once the server is running, e.g.:

```
curl -H "x-api-key: $API_KEY" http://localhost:3000/api/v1/contacts?phone=+441315550101
```

## Applying migrations

Schema lives in `supabase/migrations/`, seed data in `supabase/seed.sql`.

`supabase link` currently fails against this project — the CLI throws a
`SchemaError` while parsing this project's API key metadata (an upstream CLI
bug, not a credentials problem). Push migrations directly with `--db-url`
instead, which skips the link step entirely:

```
npx supabase db push --db-url "postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres"
npx supabase db push --db-url "postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres" --include-seed
```

The database password is percent-encoding-sensitive if it contains special
characters — URL-encode it before substituting into the connection string.
Get the password from the **Connect** dialog on your project dashboard (reset
it there if you don't have it).
