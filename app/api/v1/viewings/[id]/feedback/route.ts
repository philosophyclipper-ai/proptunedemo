import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toViewing } from "@/lib/api/serializers";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  const body = await request.json();

  if (!body.body) {
    throw new ApiError("validation_failed", "body is required");
  }

  const { data: viewing } = await supabase
    .from("viewings")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();

  if (!viewing) throw new ApiError("not_found", `No viewing with id ${id}`);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /viewings/:id/feedback",
    idempotencyKey,
    async () => {
      // One feedback per viewing, replaced on each write. It used to append
      // a note, which is why the property page showed a viewing's whole
      // relay log under the heading "Feedback". The running commentary is
      // POST /notes with entity_type "viewing" — progress notes — and stays
      // inside the viewing record.
      const { data, error } = await supabase
        .from("viewings")
        .update({ feedback: body.body, feedback_at: new Date().toISOString() })
        .eq("agency_id", agencyId)
        .eq("id", id)
        .select("*, properties(ref)")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: toViewing(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
