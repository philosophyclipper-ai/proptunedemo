import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toMaintenanceIssue } from "@/lib/api/serializers";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const field of ["description", "status", "urgency"]) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("maintenance_issues")
    .update(updates)
    .eq("agency_id", agencyId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No maintenance issue with id ${id}`);
  return NextResponse.json(toMaintenanceIssue(data));
});
