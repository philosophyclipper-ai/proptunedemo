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
  const body = await request.json().catch(() => ({}));
  await requireOfferById(supabase, agencyId, id);

  const { status, body: responseBody } = await withIdempotency(
    supabase,
    agencyId,
    "POST /offers/:id/counter",
    idempotencyKey,
    async () => {
      const { data, error } = await supabase
        .from("offers")
        .update({ status: "countered" })
        .eq("id", id)
        .select("*, properties(ref)")
        .single();

      if (error) throw new ApiError("validation_failed", error.message);

      if (body.amount != null) {
        await supabase.from("notes").insert({
          agency_id: agencyId,
          entity_type: "offer",
          entity_id: id,
          author_type: body.author_type ?? "user",
          body: `Countered at ${body.amount}`,
        });
      }

      return { status: 200, body: toOffer(data) };
    }
  );

  return NextResponse.json(responseBody, { status });
});
