import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";

export async function getPropertyByRef(
  supabase: SupabaseClient,
  agencyId: string,
  ref: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("ref", ref)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No property with ref ${ref}`);
  return data;
}

export async function getContactByPhone(
  supabase: SupabaseClient,
  agencyId: string,
  phone: string
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId)
    .or(`phone_primary.eq.${phone},phone_secondary.eq.${phone}`)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  return data;
}

export async function requireContactById(
  supabase: SupabaseClient,
  agencyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ApiError("validation_failed", error.message);
  if (!data) throw new ApiError("not_found", `No contact with id ${id}`);
  return data;
}
