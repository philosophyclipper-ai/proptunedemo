"use server";

import { revalidatePath } from "next/cache";
import { apiPatch, apiPost } from "@/lib/ui/mutations";
import type { Contact, Property } from "@/lib/ui/types";
import type { ActionState } from "@/lib/ui/action-state";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  return value !== undefined ? Number(value) : undefined;
}

// A phone + name pair upserts via the same POST /contacts endpoint n8n/Vapi
// use — an existing phone number merges into that contact rather than
// creating a duplicate. Returns null if no phone was given (field left
// blank = skip), throws if a phone was given without a name.
async function resolveContact(
  formData: FormData,
  prefix: string,
  roles: string[]
): Promise<string | null> {
  const phone = str(formData, `${prefix}_phone`);
  const name = str(formData, `${prefix}_name`);
  if (!phone) return null;
  if (!name) throw new Error("A name is required alongside a phone number");

  const result = await apiPost<Contact>("/api/v1/contacts", {
    name,
    phone_primary: phone,
    company: str(formData, `${prefix}_company`),
    roles,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

export async function createListing(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const listingType = str(formData, "listing_type") as "sales" | "lettings" | undefined;
    if (!listingType) throw new Error("listing_type is required");

    const vendorContactId = await resolveContact(
      formData,
      "vendor",
      listingType === "lettings" ? ["landlord"] : ["vendor"]
    );

    const payload: Record<string, unknown> = {
      listing_type: listingType,
      address_line1: str(formData, "address_line1"),
      address_line2: str(formData, "address_line2"),
      city: str(formData, "city"),
      postcode: str(formData, "postcode"),
      bedrooms: num(formData, "bedrooms"),
      property_type: str(formData, "property_type"),
      council_tax_band: str(formData, "council_tax_band"),
      epc_rating: str(formData, "epc_rating"),
      viewing_conducted_by: str(formData, "viewing_conducted_by"),
      viewing_notes: str(formData, "viewing_notes"),
      vendor_contact_id: vendorContactId ?? undefined,
    };

    if (listingType === "sales") {
      payload.tenure = str(formData, "tenure");
      payload.price_qualifier = str(formData, "price_qualifier");
      payload.asking_price = num(formData, "asking_price");
    } else {
      payload.rent_amount = num(formData, "rent_amount");
      payload.rent_frequency = str(formData, "rent_frequency");
    }

    const result = await apiPost<Property>("/api/v1/properties", payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(listingType === "sales" ? "/sales" : "/lettings");
    return { status: "success", redirectTo: `/properties/${result.data.ref}` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function updateListing(
  ref: string,
  listingType: "sales" | "lettings",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const vendorContactId = await resolveContact(
      formData,
      "vendor",
      listingType === "lettings" ? ["landlord"] : ["vendor"]
    );

    const payload: Record<string, unknown> = {
      address_line1: str(formData, "address_line1"),
      address_line2: str(formData, "address_line2") ?? null,
      city: str(formData, "city") ?? null,
      postcode: str(formData, "postcode"),
      bedrooms: num(formData, "bedrooms") ?? null,
      property_type: str(formData, "property_type") ?? null,
      status: str(formData, "status"),
      council_tax_band: str(formData, "council_tax_band") ?? null,
      epc_rating: str(formData, "epc_rating") ?? null,
      viewing_conducted_by: str(formData, "viewing_conducted_by"),
      viewing_notes: str(formData, "viewing_notes") ?? null,
    };
    if (vendorContactId) payload.vendor_contact_id = vendorContactId;

    if (listingType === "sales") {
      payload.tenure = str(formData, "tenure") ?? null;
      payload.price_qualifier = str(formData, "price_qualifier") ?? null;
      payload.asking_price = num(formData, "asking_price") ?? null;
      payload.closing_date = str(formData, "closing_date") ?? null;
    } else {
      payload.rent_amount = num(formData, "rent_amount") ?? null;
      payload.rent_frequency = str(formData, "rent_frequency") ?? null;
    }

    const result = await apiPatch<Property>(`/api/v1/properties/${ref}`, payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(`/properties/${ref}`);
    revalidatePath("/sales");
    revalidatePath("/lettings");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function createViewingAction(
  ref: string,
  listingType: "sales" | "lettings",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const contactId = await resolveContact(formData, "contact", [
      listingType === "lettings" ? "applicant" : "buyer",
    ]);
    if (!contactId) throw new Error("Contact name and phone are required");

    const scheduledAt = str(formData, "scheduled_at");
    const proposed = [str(formData, "proposed_time_1"), str(formData, "proposed_time_2")].filter(
      (t): t is string => Boolean(t)
    );

    const payload: Record<string, unknown> = { property_ref: ref, contact_id: contactId };
    if (scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString();
    if (proposed.length > 0) {
      payload.proposed_times = proposed.map((t) => new Date(t).toISOString());
    }
    if (listingType === "sales") {
      payload.mortgage_status = str(formData, "mortgage_status") ?? null;
      payload.buyer_property_status = str(formData, "buyer_property_status") ?? null;
    }

    const result = await apiPost("/api/v1/viewings", payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(`/properties/${ref}`);
    revalidatePath(listingType === "sales" ? "/sales/viewings" : "/lettings/viewings");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function createOfferAction(
  ref: string,
  listingType: "sales" | "lettings",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const contactId = await resolveContact(formData, "contact", [
      listingType === "lettings" ? "applicant" : "buyer",
    ]);
    if (!contactId) throw new Error("Contact name and phone are required");

    const solicitorId =
      listingType === "sales" ? await resolveContact(formData, "solicitor", ["solicitor"]) : null;

    const amount = num(formData, "amount");
    const payload = {
      property_ref: ref,
      contact_id: contactId,
      type: amount != null ? "offer" : "note_of_interest",
      amount: amount ?? null,
      received_via: str(formData, "received_via") ?? "in_person",
      solicitor_contact_id: solicitorId,
    };

    const result = await apiPost("/api/v1/offers", payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(`/properties/${ref}`);
    revalidatePath(listingType === "sales" ? "/sales/offers" : "/lettings/applications");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function createMaintenanceAction(
  ref: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const contactId = await resolveContact(formData, "contact", ["tenant"]);
    const description = str(formData, "description");
    if (!description) throw new Error("Description is required");

    const payload = {
      property_ref: ref,
      contact_id: contactId,
      description,
      urgency: str(formData, "urgency") ?? "normal",
    };

    const result = await apiPost("/api/v1/maintenance", payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(`/properties/${ref}`);
    revalidatePath("/lettings/maintenance");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function createContactAction(
  section: "sales" | "lettings",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = str(formData, "name");
    const phone = str(formData, "phone_primary");
    if (!name || !phone) throw new Error("Name and phone are required");

    const roles = formData.getAll("roles").filter((r): r is string => typeof r === "string");
    if (roles.length === 0) throw new Error("Select at least one role");

    const payload = {
      name,
      phone_primary: phone,
      email: str(formData, "email") ?? null,
      company: str(formData, "company") ?? null,
      roles,
    };

    const result = await apiPost<Contact>("/api/v1/contacts", payload);
    if (!result.ok) throw new Error(result.error);

    revalidatePath(section === "sales" ? "/sales/contacts" : "/lettings/contacts");
    return { status: "success", redirectTo: `/contacts/${result.data.id}` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong" };
  }
}
