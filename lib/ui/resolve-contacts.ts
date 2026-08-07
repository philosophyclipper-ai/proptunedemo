import { getContact } from "@/lib/ui/api-client";
import type { Contact } from "@/lib/ui/types";

// Viewings/offers/valuations/maintenance carry a bare contact_id (allowed —
// only properties hide their id). The board/tab views want names though, so
// this batch-resolves the small, bounded set of distinct contacts involved.
export async function resolveContacts(
  ids: (string | null | undefined)[]
): Promise<Map<string, Contact>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const contacts = await Promise.all(
    uniqueIds.map((id) => getContact(id).catch(() => null))
  );

  const map = new Map<string, Contact>();
  uniqueIds.forEach((id, index) => {
    const contact = contacts[index];
    if (contact) map.set(id, contact);
  });
  return map;
}
