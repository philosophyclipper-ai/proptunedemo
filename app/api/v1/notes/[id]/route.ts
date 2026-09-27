import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toNote } from "@/lib/api/serializers";

// UI only. Notes are the system's memory, so a negotiator needs the same
// control over them as over any other record they typed — a mistyped
// availability line or a stale arrangement note has to be removable, not
// merely superseded by a newer note.
//
// Deliberately not offered to the voice agent: an agent that can delete
// what it just wrote (or what a colleague wrote) is a far worse failure
// than one that can only add.

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const body = await request.json();

  if (!body.body) throw new ApiError("validation_failed", "body is required");

  const { data, error } = await supabase
    .from("notes")
    .update({ body: body.body })
    .eq("agency_id", agencyId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No note with id ${id}`);

  return NextResponse.json(toNote(data));
});

// Idempotent by nature — deleting an already-deleted note reports the same
// result rather than failing, so a retried request can't error out on a
// note the first attempt already removed.
export const DELETE = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("agency_id", agencyId)
    .eq("id", id);

  if (error) throw new ApiError("validation_failed", error.message);

  return NextResponse.json({ deleted: true, id });
});
