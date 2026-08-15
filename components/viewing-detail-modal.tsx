"use client";

import { Modal } from "@/components/modal";
import { Pill } from "@/components/pill";
import { QuickEditContactForm } from "@/components/forms/quick-edit-contact-form";
import { EditViewingFieldsForm } from "@/components/forms/edit-viewing-fields-form";
import { ApproveViewingButton, ViewingDangerZone } from "@/components/forms/viewing-quick-actions";
import { AddNoteForm } from "@/components/forms/add-note-form";
import { NotesList } from "@/components/notes-list";
import { titleCase } from "@/lib/ui/format";
import { viewingStatusTone } from "@/lib/ui/status-tone";
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
  listingType = "sales",
}: {
  viewing: Viewing;
  contact?: Contact;
  notes: Note[];
  revalidatePaths: string[];
  className?: string;
  children: ReactNode;
  listingType?: "sales" | "lettings";
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
          <div className="flex items-center justify-between gap-3">
            <Pill tone={viewingStatusTone(viewing.status)} label={titleCase(viewing.status)} />
            <ApproveViewingButton viewing={viewing} revalidatePaths={revalidatePaths} />
          </div>

          {contact && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Contact
              </p>
              <QuickEditContactForm
                contact={contact}
                revalidatePaths={revalidatePaths}
                showBuyerFields={listingType === "sales"}
              />
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

          <ViewingDangerZone viewing={viewing} revalidatePaths={revalidatePaths} onDeleted={close} />
        </div>
      )}
    </Modal>
  );
}
