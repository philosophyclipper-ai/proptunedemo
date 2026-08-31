import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toContact } from "@/lib/api/serializers";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/api/pagination";
import { phonesMatch, toE164Phone } from "@/lib/api/phone";
import { attachContactEmbeds, parseEmbed, withEmbed } from "@/lib/api/embed";

const CONTACT_EMBEDS = ["vendors", "viewings", "offers", "property_contacts"];

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const q = searchParams.get("q");
  const ids = searchParams.get("ids");
  const cursor = searchParams.get("cursor");
  const embeds = parseEmbed(searchParams, CONTACT_EMBEDS);

  async function serialize(rows: { id: string }[]) {
    const embedMap =
      embeds.length > 0 ? await attachContactEmbeds(supabase, agencyId, rows, embeds) : new Map();
    return rows.map((r) => withEmbed(toContact(r), embedMap.get(r.id)));
  }

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId);

  // UI-only batch lookup — resolves the distinct contacts behind a page's
  // worth of viewings/offers in one query instead of one per contact.
  // Bypasses pagination entirely since it's a bounded, explicit id list.
  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const { data, error } = await query.in("id", idList);
    if (error) throw new ApiError("validation_failed", error.message);
    return NextResponse.json({ contacts: await serialize(data ?? []), next_cursor: null });
  }

  // Real numbers in this CRM are genuinely inconsistent in format
  // (+447700900202 / 07700900202 / 07700 900202 can all be the same
  // contact) — matching normalises rather than relying on exact string
  // equality. This can only find more than literal equality did before,
  // never fewer, so it's a strict improvement for every existing caller.
  if (phone) {
    const { data, error } = await query;
    if (error) throw new ApiError("validation_failed", error.message);
    const matches = (data ?? []).filter(
      (c) => phonesMatch(c.phone_primary as string, phone) || phonesMatch(c.phone_secondary as string, phone)
    );
    return NextResponse.json({ contacts: await serialize(matches), next_cursor: null });
  }
  if (q) {
    // Voice/n8n use the exact-match `phone` param above; `q` is the UI's
    // free-text search box, so it also catches a partially-typed number.
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,phone_primary.ilike.%${q}%,phone_secondary.ilike.%${q}%`
    );
  }

  const decoded = cursor ? decodeCursor(cursor) : null;
  if (decoded) {
    query = query.or(
      `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw new ApiError("validation_failed", error.message);

  const results = data ?? [];
  const nextCursor =
    results.length === PAGE_SIZE
      ? encodeCursor(
          results[results.length - 1].created_at,
          results[results.length - 1].id
        )
      : null;

  return NextResponse.json({
    contacts: await serialize(results),
    next_cursor: nextCursor,
  });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.phone_primary || !body.name) {
    throw new ApiError("validation_failed", "name and phone_primary are required");
  }

  const primaryResult = toE164Phone(body.phone_primary);
  if ("error" in primaryResult) throw new ApiError("validation_failed", primaryResult.error);
  const phonePrimary = primaryResult.value;

  let phoneSecondary: string | undefined;
  if (body.phone_secondary) {
    const secondaryResult = toE164Phone(body.phone_secondary);
    if ("error" in secondaryResult) throw new ApiError("validation_failed", secondaryResult.error);
    phoneSecondary = secondaryResult.value;
  }

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /contacts",
    idempotencyKey,
    async () => {
      // Matching on the normalised value (not the raw input) means an
      // existing contact stored as +447700900202 is correctly found even
      // if this call sent 07700900202 — previously a literal match, which
      // silently missed that case and created a duplicate instead.
      const { data: existing } = await supabase
        .from("contacts")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("phone_primary", phonePrimary)
        .maybeSingle();

      if (existing) {
        const mergedRoles = Array.from(
          new Set([...(existing.roles ?? []), ...(body.roles ?? [])])
        );
        const { data, error } = await supabase
          .from("contacts")
          .update({
            name: body.name ?? existing.name,
            roles: mergedRoles,
            phone_secondary: phoneSecondary ?? existing.phone_secondary,
            email: body.email ?? existing.email,
            company: body.company ?? existing.company,
            mortgage_status: body.mortgage_status ?? existing.mortgage_status,
            property_ownership_status:
              body.property_ownership_status ?? existing.property_ownership_status,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error) throw new ApiError("validation_failed", error.message);
        return { status: 200, body: toContact(data) };
      }

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          agency_id: agencyId,
          name: body.name,
          roles: body.roles ?? [],
          phone_primary: phonePrimary,
          phone_secondary: phoneSecondary ?? null,
          email: body.email ?? null,
          company: body.company ?? null,
          mortgage_status: body.mortgage_status ?? null,
          property_ownership_status: body.property_ownership_status ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: toContact(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
