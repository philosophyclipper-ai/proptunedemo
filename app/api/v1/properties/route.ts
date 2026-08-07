import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toProperty } from "@/lib/api/serializers";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/api/pagination";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");
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
