import { getNotes } from "@/lib/ui/api-client";
import type { Note } from "@/lib/ui/types";

// Notes are polymorphic and fetched one entity at a time via GET /notes, so
// this batches the small, bounded set of entities actually on screen
// (viewings on a property page, offers on a board, maintenance issues on
// the board) into one Map keyed by entity id.
export async function resolveNotesByEntity(
  entityType: string,
  ids: string[]
): Promise<Map<string, Note[]>> {
  const results = await Promise.all(
    ids.map((id) =>
      getNotes({ entity_type: entityType, entity_id: id })
        .then((r) => r.notes)
        .catch(() => [])
    )
  );

  const map = new Map<string, Note[]>();
  ids.forEach((id, index) => {
    if (results[index].length > 0) map.set(id, results[index]);
  });
  return map;
}
