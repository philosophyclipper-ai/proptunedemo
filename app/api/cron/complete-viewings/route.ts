import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";

// Vercel-triggered only — not part of the /api/v1 surface, no x-api-key.
// Vercel calls this with `Authorization: Bearer ${CRON_SECRET}` when
// CRON_SECRET is set on the project; refuses to run if it isn't, same
// fail-closed default as proxy.ts's Basic Auth.
//
// A viewing whose scheduled_at has passed and is still 'confirmed' becomes
// 'completed'. Nothing else moves — 'requested'/'incomplete' with a past
// date are stale, a different problem, not silently reinterpreted here.
export const GET = withErrorHandling(async (request) => {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    throw new ApiError("unauthorized", "Missing or invalid cron authorization");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("viewings")
    .update({ status: "completed" })
    .eq("status", "confirmed")
    .lt("scheduled_at", new Date().toISOString())
    .select("id");

  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ completed: (data ?? []).length });
});
