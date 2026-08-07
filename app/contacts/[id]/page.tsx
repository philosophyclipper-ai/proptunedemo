import { notFound } from "next/navigation";
import { getContact, getContactTimeline } from "@/lib/ui/api-client";
import { formatDateTime, titleCase } from "@/lib/ui/format";
import { Pill } from "@/components/pill";

const KIND_LABELS: Record<string, string> = {
  note: "Note",
  viewing: "Viewing",
  valuation: "Valuation",
  offer: "Offer",
  task: "Task",
  maintenance_issue: "Maintenance",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContact(id).catch(() => null);
  if (!contact) notFound();

  const { timeline } = await getContactTimeline(id);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-navy-950">{contact.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {contact.roles.map((role) => (
            <Pill key={role} tone="navy" label={titleCase(role)} />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">Phone</dt>
            <dd className="text-ink">{contact.phone_primary}</dd>
          </div>
          {contact.phone_secondary && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">
                Secondary Phone
              </dt>
              <dd className="text-ink">{contact.phone_secondary}</dd>
            </div>
          )}
          {contact.email && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Email</dt>
              <dd className="text-ink">{contact.email}</dd>
            </div>
          )}
        </dl>
      </header>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-ink-muted">No activity yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {timeline.map((entry) => (
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
                  <span className="text-xs text-ink-faint">
                    {formatDateTime(entry.occurred_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">{entry.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
