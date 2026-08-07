import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/errors";
import { toOffer } from "@/lib/api/serializers";
import { requireOfferById } from "@/lib/api/offers";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const idempotencyKey = request.headers.get("idempotency-key");
  await requireOfferById(supabase, agencyId, id);

  const { status, body } = await withIdempotency(
    supabase,
    agencyId,
    "POST /offers/:id/accept",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);
      return { status: 200, body: toOffer(data) };
    }
  );

  return NextResponse.json(body, { status });
});
