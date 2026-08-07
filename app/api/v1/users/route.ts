import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toUser } from "@/lib/api/serializers";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("agency_id", agencyId)
    .order("name", { ascending: true });

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json({ users: (data ?? []).map(toUser) });
});
