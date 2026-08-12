import { Pill } from "@/components/pill";
import { formatDateTime } from "@/lib/ui/format";
import type { Note } from "@/lib/ui/types";

export function NotesList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <p className="text-sm text-ink-muted">No notes yet.</p>;
  return (
    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
      {notes.map((n) => (
        <li key={n.id} className="rounded border border-border-hairline bg-cream p-2 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <Pill
              tone={n.author_type === "ai" ? "amber" : "navy"}
              label={n.author_type === "ai" ? "AI" : "Staff"}
            />
            <span className="text-xs text-ink-faint">{formatDateTime(n.created_at)}</span>
          </div>
          <p className="text-ink">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}
