import { getContactsByIds } from "@/lib/ui/api-client";
import type { Contact } from "@/lib/ui/types";

// Viewings/offers/valuations/maintenance carry a bare contact_id (allowed —
// only properties hide their id). The board/tab views want names though, so
// this batch-resolves the small, bounded set of distinct contacts involved
// in a single request rather than one round trip per contact.
export async function resolveContacts(
  ids: (string | null | undefined)[]
): Promise<Map<string, Contact>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const contacts = await getContactsByIds(uniqueIds).catch(() => []);

  const map = new Map<string, Contact>();
  for (const contact of contacts) map.set(contact.id, contact);
  return map;
}
