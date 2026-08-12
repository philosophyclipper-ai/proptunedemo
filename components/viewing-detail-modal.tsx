"use client";

import { Modal } from "@/components/modal";
import { QuickEditContactForm } from "@/components/forms/quick-edit-contact-form";
import { EditViewingFieldsForm } from "@/components/forms/edit-viewing-fields-form";
import { ViewingQuickActions } from "@/components/forms/viewing-quick-actions";
import { AddNoteForm } from "@/components/forms/add-note-form";
import { NotesList } from "@/components/notes-list";
import type { Contact, Note, Viewing } from "@/lib/ui/types";
import type { ReactNode } from "react";

const DEFAULT_CLASS =
  "cursor-pointer rounded border border-border-hairline bg-cream p-3 hover:border-amber-500";

export function ViewingDetailModal({
  viewing,
  contact,
  notes,
  revalidatePaths,
  className,
  children,
}: {
  viewing: Viewing;
  contact?: Contact;
  notes: Note[];
  revalidatePaths: string[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title="Viewing"
      trigger={(open) => (
        <li onClick={open} className={className ?? DEFAULT_CLASS}>
          {children}
        </li>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-5">
          <ViewingQuickActions
            viewing={viewing}
            revalidatePaths={revalidatePaths}
            onDeleted={close}
          />

          {contact && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Contact
              </p>
              <QuickEditContactForm contact={contact} revalidatePaths={revalidatePaths} />
            </section>
          )}

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Viewing
            </p>
            <EditViewingFieldsForm viewing={viewing} revalidatePaths={revalidatePaths} />
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Notes
            </p>
            <NotesList notes={notes} />
            <div className="mt-2">
              <AddNoteForm
                entityType="viewing"
                entityId={viewing.id}
                revalidatePaths={revalidatePaths}
              />
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
