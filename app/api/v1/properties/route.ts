import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toProperty } from "@/lib/api/serializers";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/api/pagination";
import { generatePropertyRef } from "@/lib/api/generate-ref";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");
  const q = searchParams.get("q");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const beds = searchParams.get("beds");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const listingType = searchParams.get("listing_type");
  const cursor = searchParams.get("cursor");

  let query = supabase
    .from("properties")
    .select("*, property_photos(url, sort_order)")
    .eq("agency_id", agencyId);

  if (postcode) query = query.ilike("postcode", `${postcode}%`);
  if (q) {
    query = query.or(
      `address_line1.ilike.%${q}%,address_line2.ilike.%${q}%,postcode.ilike.%${q}%,city.ilike.%${q}%`
    );
  }
  if (minPrice) query = query.gte("asking_price", Number(minPrice));
  if (maxPrice) query = query.lte("asking_price", Number(maxPrice));
  if (beds) query = query.eq("bedrooms", Number(beds));
  if (type) query = query.eq("property_type", type);
  if (status) query = query.eq("status", status);
  if (listingType) query = query.eq("listing_type", listingType);

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
    properties: results.map(toProperty),
    next_cursor: nextCursor,
  });
});

// UI only — a new listing is onboarded by a negotiator, never an agent.
export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.address_line1 || !body.postcode || !body.listing_type) {
    throw new ApiError(
      "validation_failed",
      "address_line1, postcode and listing_type are required"
    );
  }
  if (!["sales", "lettings"].includes(body.listing_type)) {
    throw new ApiError("validation_failed", "listing_type must be sales or lettings");
  }

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /properties",
    idempotencyKey,
    async () => {
      const insertPayload = {
        agency_id: agencyId,
        address_line1: body.address_line1,
        address_line2: body.address_line2 ?? null,
        city: body.city ?? null,
        postcode: body.postcode,
        bedrooms: body.bedrooms ?? null,
        property_type: body.property_type ?? null,
        tenure: body.tenure ?? null,
        status: body.status ?? (body.listing_type === "lettings" ? "on_market" : "available"),
        listing_type: body.listing_type,
        price_qualifier: body.price_qualifier ?? null,
        asking_price: body.asking_price ?? null,
        home_report_value: body.home_report_value ?? null,
        home_report_url: body.home_report_url ?? null,
        rent_amount: body.rent_amount ?? null,
        rent_frequency: body.rent_frequency ?? null,
        council_tax_band: body.council_tax_band ?? null,
        epc_rating: body.epc_rating ?? null,
        vendor_contact_id: body.vendor_contact_id ?? null,
        viewing_conducted_by: body.viewing_conducted_by ?? "agency_staff",
        viewing_calendar_id: body.viewing_calendar_id ?? null,
        viewing_notes: body.viewing_notes ?? null,
        went_live_at: body.went_live_at ?? new Date().toISOString(),
        negotiator_id: body.negotiator_id ?? null,
        description: body.description ?? null,
      };

      let ref: string = body.ref ?? generatePropertyRef(body.postcode);
      let data, error;

      for (let attempt = 0; attempt < 5; attempt++) {
        ({ data, error } = await supabase
          .from("properties")
          .insert({ ...insertPayload, ref })
          .select("*, property_photos(url, sort_order)")
          .single());

        if (!error) break;
        if (error.code === "23505" && !body.ref) {
          ref = generatePropertyRef(body.postcode);
          continue;
        }
        break;
      }

      if (error) {
        throw new ApiError(
          error.code === "23505" ? "conflict" : "validation_failed",
          error.message
        );
      }
      return { status: 201, body: toProperty(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
