import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toTask } from "@/lib/api/serializers";

export const GET = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const assignee = searchParams.get("assignee");
  const status = searchParams.get("status");

  let query = supabase.from("tasks").select("*").eq("agency_id", agencyId);
  if (assignee) query = query.eq("assignee_user_id", assignee);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ tasks: (data ?? []).map(toTask) });
});

export const POST = withErrorHandling(async (request) => {
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.title) {
    throw new ApiError("validation_failed", "title is required");
  }

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /tasks",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          agency_id: agencyId,
          entity_type: body.entity_type ?? null,
          entity_id: body.entity_id ?? null,
          assignee_user_id: body.assignee_user_id ?? null,
          title: body.title,
          body: body.body ?? null,
          due_at: body.due_at ?? null,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: toTask(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
