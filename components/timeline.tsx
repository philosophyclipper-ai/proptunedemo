import { formatDateTime } from "@/lib/ui/format";
import { Pill } from "@/components/pill";
import type { TimelineEntry } from "@/lib/ui/types";

const KIND_LABELS: Record<string, string> = {
  note: "Note",
  viewing: "Viewing",
  valuation: "Valuation",
  offer: "Offer",
  task: "Task",
  maintenance_issue: "Maintenance",
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-ink-muted">No activity yet.</p>;

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={`${entry.kind}-${entry.id}`}
          className="rounded-lg border border-border-hairline bg-paper p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-700">
                {KIND_LABELS[entry.kind] ?? entry.kind}
              </span>
              {entry.kind === "note" && (
                <Pill
                  tone={entry.author_type === "ai" ? "amber" : "navy"}
                  label={entry.author_type === "ai" ? "AI" : "Staff"}
                />
              )}
            </div>
            <span className="text-xs text-ink-faint">{formatDateTime(entry.occurred_at)}</span>
          </div>
          <p className="mt-2 text-sm text-ink">{entry.summary}</p>
        </li>
      ))}
    </ol>
  );
}
