import { notFound } from "next/navigation";
import { getContact, getContactTimeline } from "@/lib/ui/api-client";
import { titleCase } from "@/lib/ui/format";
import { Pill } from "@/components/pill";
import { EditContactButton } from "@/components/edit-contact-button";
import { AddNoteForm } from "@/components/forms/add-note-form";
import { Timeline } from "@/components/timeline";

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
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-3xl font-semibold text-navy-950">{contact.name}</h1>
          <EditContactButton contact={contact} />
        </div>
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
          {contact.company && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Company</dt>
              <dd className="text-ink">{contact.company}</dd>
            </div>
          )}
        </dl>
      </header>

      <section className="mb-6 rounded-lg border border-border-hairline bg-paper p-4">
        <h2 className="mb-2 font-heading text-sm font-semibold text-navy-950">Add a Note</h2>
        <AddNoteForm entityType="contact" entityId={contact.id} revalidatePaths={[`/contacts/${contact.id}`]} />
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">Timeline</h2>
        <Timeline entries={timeline} />
      </section>
    </div>
  );
}
