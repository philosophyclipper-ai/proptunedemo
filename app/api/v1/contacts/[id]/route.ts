import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { withErrorHandling } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { toContact } from "@/lib/api/serializers";
import { requireContactById } from "@/lib/api/lookups";
import { attachContactEmbeds, parseEmbed, withEmbed } from "@/lib/api/embed";

const CONTACT_EMBEDS = ["vendors", "viewings", "offers"];

export const GET = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  const { searchParams } = new URL(request.url);
  const embeds = parseEmbed(searchParams, CONTACT_EMBEDS);
  const contact = await requireContactById(supabase, agencyId, id);

  const embedMap =
    embeds.length > 0
      ? await attachContactEmbeds(supabase, agencyId, [contact], embeds)
      : new Map();
  return NextResponse.json(withEmbed(toContact(contact), embedMap.get(contact.id)));
});

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, agencyId } = await requireApiContext(request);
  await requireContactById(supabase, agencyId, id);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const field of [
    "name",
    "roles",
    "phone_primary",
    "phone_secondary",
    "email",
    "company",
    "mortgage_status",
    "property_ownership_status",
  ]) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new ApiError("validation_failed", error.message);
  return NextResponse.json(toContact(data));
});
