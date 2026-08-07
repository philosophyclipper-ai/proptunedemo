import type {
  Contact,
  MaintenanceIssue,
  Note,
  Offer,
  Property,
  TimelineEntry,
  Valuation,
  Viewing,
  ViewingArrangement,
} from "@/lib/ui/types";

// Every CRM page reads through /api/v1 like any other client would — the UI
// has no direct database access. Requests carry the same x-api-key n8n/Vapi
// use; the browser never sees it, only this server-side fetch does.

function baseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? "3000"}`;
}

async function apiGet<T>(
  path: string,
  searchParams?: Record<string, string | undefined>
): Promise<T> {
  const url = new URL(path, baseUrl());
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { "x-api-key": process.env.API_KEY ?? "" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `${path} failed with ${res.status}`);
  }

  return res.json();
}

export async function getProperties(params: {
  status?: string;
  postcode?: string;
  cursor?: string;
}) {
  return apiGet<{ properties: Property[]; next_cursor: string | null }>(
    "/api/v1/properties",
    params
  );
}

export async function getAllProperties(): Promise<Property[]> {
  const all: Property[] = [];
  let cursor: string | undefined;
  do {
    const page = await getProperties({ cursor });
    all.push(...page.properties);
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
  return all;
}

export async function getProperty(ref: string) {
  return apiGet<Property>(`/api/v1/properties/${ref}`);
}

export async function getViewingArrangement(ref: string) {
  return apiGet<ViewingArrangement>(`/api/v1/properties/${ref}/viewing-arrangement`);
}

export async function getPropertyNotes(ref: string) {
  return apiGet<{ notes: Note[] }>(`/api/v1/properties/${ref}/notes`);
}

export async function getNotes(params: { entity_type: string; entity_id: string }) {
  return apiGet<{ notes: Note[] }>("/api/v1/notes", params);
}

export async function getContact(id: string) {
  return apiGet<Contact>(`/api/v1/contacts/${id}`);
}

export async function getContactTimeline(id: string) {
  return apiGet<{ timeline: TimelineEntry[] }>(`/api/v1/timeline/contact/${id}`);
}

export async function getViewings(params: { property_ref?: string } = {}) {
  return apiGet<{ viewings: Viewing[] }>("/api/v1/viewings", params);
}

export async function getValuations() {
  return apiGet<{ valuations: Valuation[] }>("/api/v1/valuations");
}

export async function getOffers(params: { property_ref?: string } = {}) {
  return apiGet<{ offers: Offer[] }>("/api/v1/offers", params);
}

export async function getMaintenanceIssues(params: { property_ref?: string } = {}) {
  return apiGet<{ maintenance_issues: MaintenanceIssue[] }>("/api/v1/maintenance", params);
}
