import { getSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/api/errors";

let cachedAgencyId: string | null = null;

/**
 * Verifies the static x-api-key header and resolves the single demo agency.
 * There's exactly one agency in this dataset, so we look it up once and
 * cache it for the life of the server instance rather than threading an
 * agency id through every request.
 */
export async function requireApiContext(request: Request) {
  const key = request.headers.get("x-api-key");
  if (!key || key !== process.env.API_KEY) {
    throw new ApiError("unauthorized", "Missing or invalid x-api-key header");
  }

  const supabase = getSupabaseClient();

  if (!cachedAgencyId) {
    const { data, error } = await supabase
      .from("agencies")
      .select("id")
      .limit(1)
      .single();

    if (error || !data) {
      throw new ApiError("not_found", "No agency configured");
    }
    cachedAgencyId = data.id;
  }

  return { supabase, agencyId: cachedAgencyId as string };
}
