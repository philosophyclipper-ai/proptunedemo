"use client";

import { Modal } from "@/components/modal";
import { EditMaintenanceFieldsForm } from "@/components/forms/edit-maintenance-fields-form";
import { AddNoteForm } from "@/components/forms/add-note-form";
import { NotesList } from "@/components/notes-list";
import type { MaintenanceIssue, Note } from "@/lib/ui/types";
import type { ReactNode } from "react";

const DEFAULT_CLASS =
  "cursor-pointer rounded-lg border border-border-hairline bg-paper p-3 text-sm hover:border-amber-500";

export function MaintenanceDetailModal({
  issue,
  notes,
  revalidatePaths,
  className,
  children,
}: {
  issue: MaintenanceIssue;
  notes: Note[];
  revalidatePaths: string[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title="Maintenance Issue"
      trigger={(open) => (
        <li onClick={open} className={className ?? DEFAULT_CLASS}>
          {children}
        </li>
      )}
    >
      {() => (
        <div className="flex flex-col gap-5">
          <section>
            <EditMaintenanceFieldsForm issue={issue} revalidatePaths={revalidatePaths} />
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Notes
            </p>
            <NotesList notes={notes} />
            <div className="mt-2">
              <AddNoteForm
                entityType="maintenance_issue"
                entityId={issue.id}
                revalidatePaths={revalidatePaths}
              />
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
