"use client";

import { Modal } from "@/components/modal";
import { NotesList } from "@/components/notes-list";
import { AddPropertyNoteForm } from "@/components/forms/add-property-note-form";
import type { Note } from "@/lib/ui/types";

export function PropertyNotesButton({
  propertyRef,
  notes,
}: {
  propertyRef: string;
  notes: Note[];
}) {
  const revalidatePaths = [`/properties/${propertyRef}`];

  return (
    <Modal
      title="Notes"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim"
        >
          Notes {notes.length > 0 && `(${notes.length})`}
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-4">
          <NotesList notes={notes} />
          <AddPropertyNoteForm propertyRef={propertyRef} revalidatePaths={revalidatePaths} />
        </div>
      )}
    </Modal>
  );
}
