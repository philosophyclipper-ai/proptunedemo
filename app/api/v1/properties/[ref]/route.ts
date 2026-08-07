import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toProperty } from "@/lib/api/serializers";
import { getPropertyByRef } from "@/lib/api/lookups";

export const GET = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const property = await getPropertyByRef(supabase, agencyId, ref);
  return NextResponse.json(toProperty(property));
});

// UI only — status and closing_date are never set by an agent.
export const PATCH = withErrorHandling(async (request, { params }) => {
  const { ref } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  await getPropertyByRef(supabase, agencyId, ref);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.closing_date !== undefined) updates.closing_date = body.closing_date;

  if (Object.keys(updates).length === 0) {
    throw new ApiError("validation_failed", "status or closing_date is required");
  }

  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .select("*")
    .single();

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json(toProperty(data));
});
