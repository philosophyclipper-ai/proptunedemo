import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toContact } from "@/lib/api/serializers";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/api/pagination";
import { toE164Phone } from "@/lib/api/phone";
import { attachContactEmbeds, parseEmbed, withEmbed } from "@/lib/api/embed";
import { findContactsByPhone } from "@/lib/api/lookups";

const CONTACT_EMBEDS = ["vendors", "viewings", "offers", "property_contacts"];

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const email = searchParams.get("email");
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
  // contact), and a match can come from phone_primary, phone_secondary or
  // additional_numbers. That's the contacts_by_phone function (migration
  // 0049) rather than a filter here, so the database returns the matches
  // instead of the whole table for the API to sift.
  if (phone) {
    const matches = await findContactsByPhone(supabase, agencyId, phone);
    return NextResponse.json({ contacts: await serialize(matches), next_cursor: null });
  }
  // Exact address, case-insensitive — how an agency looks someone up from an
  // email thread. Unlike `q`, it won't match a partial.
  if (email) {
    const { data, error } = await query.ilike("email", email);
    if (error) throw new ApiError("validation_failed", error.message);
    return NextResponse.json({ contacts: await serialize(data ?? []), next_cursor: null });
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

  let additionalNumbers: string[] | undefined;
  if (body.additional_numbers) {
    additionalNumbers = (body.additional_numbers as string[]).map((n: string) => {
      const result = toE164Phone(n);
      if ("error" in result) throw new ApiError("validation_failed", result.error);
      return result.value;
    });
  }

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /contacts",
    idempotencyKey,
    async () => {
      // A number on file is only the same person if the name agrees.
      //
      // This used to update whatever row held the number, so a buyer
      // enquiring from a number already on file as a seller renamed the
      // seller and replaced their email — and anything reading the seller's
      // address off that record then wrote to the buyer. A shared landline,
      // a work mobile, or a test persona reusing a number all did the same.
      //
      // Same name: the same person, so fill in what's new. Different name:
      // a different person who happens to share a number, so they get their
      // own record and both are flagged as possible duplicates for a human
      // to merge or leave. Nobody's identity is overwritten either way.
      const sameNumber = await findContactsByPhone(supabase, agencyId, phonePrimary);
      const normalizeName = (value: unknown) =>
        String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
      const existing = sameNumber.find(
        (c) => normalizeName(c.name) === normalizeName(body.name)
      );

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
            additional_numbers: additionalNumbers ?? existing.additional_numbers,
            email: body.email ?? existing.email,
            company: body.company ?? existing.company,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error) throw new ApiError("validation_failed", error.message);
        return { status: 200, body: toContact(data) };
      }

      // Reached when the number is new, or when it's on file under a
      // different name. Either way a row is created rather than merged —
      // a human or agent decides whether two records are really one person
      // — but anything that looks like the same person is flagged so the
      // duplicate isn't silent.
      const [byPhone, byEmail] = await Promise.all([
        Promise.resolve(sameNumber),
        body.email
          ? supabase
              .from("contacts")
              .select("id")
              .eq("agency_id", agencyId)
              .ilike("email", String(body.email))
              .then(({ data }) => data ?? [])
          : Promise.resolve([] as { id: string }[]),
      ]);
      const duplicateIds = [
        ...new Set([...byPhone, ...byEmail].map((c) => c.id as string)),
      ];

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          agency_id: agencyId,
          name: body.name,
          roles: body.roles ?? [],
          phone_primary: phonePrimary,
          phone_secondary: phoneSecondary ?? null,
          additional_numbers: additionalNumbers ?? [],
          email: body.email ?? null,
          company: body.company ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      const contact = toContact(data);
      return duplicateIds.length > 0
        ? { status: 201, body: { ...contact, probable_duplicate: true, duplicate_of: duplicateIds } }
        : { status: 201, body: contact };
    }
  );

  return NextResponse.json(responseBody, { status });
});
