import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toNote } from "@/lib/api/serializers";

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
      // Appends a note against the viewing — the running log shown as
      // "Notes" inside the viewing record. This endpoint is named for
      // historical reasons and is what every existing n8n note node posts
      // to, so it keeps appending rather than replacing; making it write
      // the single feedback field would have each note overwrite the last.
      //
      // The one-per-viewing "how did it go" value is viewings.feedback, set
      // through PATCH /viewings/:id.
      const { data, error } = await supabase
        .from("notes")
        .insert({
          agency_id: agencyId,
          entity_type: "viewing",
          entity_id: id,
          author_type: body.author_type ?? "user",
          author_user_id: body.author_user_id ?? null,
          body: body.body,
        })
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 201, body: toNote(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
