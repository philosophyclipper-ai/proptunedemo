import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";

export async function requireOfferById(
  supabase: SupabaseClient,
  agencyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No offer with id ${id}`);
  if (data.type !== "offer") {
    throw new ApiError(
      "validation_failed",
      "Accept and reject only apply to offers, not notes of interest"
    );
  }
  return data;
}
