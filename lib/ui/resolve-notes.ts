import { getNotesByEntityIds } from "@/lib/ui/api-client";
import type { Note } from "@/lib/ui/types";

// Notes are polymorphic. This resolves every note for the bounded set of
// entities actually on screen (viewings on a property page, offers on a
// board, maintenance issues on the board) in one request, then groups them
// by entity id.
export async function resolveNotesByEntity(
  entityType: string,
  ids: string[]
): Promise<Map<string, Note[]>> {
  const uniqueIds = [...new Set(ids)];
  const notes = await getNotesByEntityIds(entityType, uniqueIds).catch(() => []);

  const map = new Map<string, Note[]>();
  for (const note of notes) {
    if (!note.entity_id) continue;
    const existing = map.get(note.entity_id);
    if (existing) existing.push(note);
    else map.set(note.entity_id, [note]);
  }
  return map;
}
