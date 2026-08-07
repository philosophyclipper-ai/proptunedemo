import { getNotes } from "@/lib/ui/api-client";
import type { Note } from "@/lib/ui/types";

// Post-viewing feedback is just a note against the viewing (entity_type =
// 'viewing'), the same thing POST /viewings/:id/feedback writes. Notes are
// fetched one viewing at a time, so this batches the small, bounded set for
// whichever viewings are on screen.
export async function resolveViewingFeedback(
  viewingIds: string[]
): Promise<Map<string, Note[]>> {
  const results = await Promise.all(
    viewingIds.map((id) =>
      getNotes({ entity_type: "viewing", entity_id: id })
        .then((r) => r.notes)
        .catch(() => [])
    )
  );

  const map = new Map<string, Note[]>();
  viewingIds.forEach((id, index) => {
    if (results[index].length > 0) map.set(id, results[index]);
  });
  return map;
}
