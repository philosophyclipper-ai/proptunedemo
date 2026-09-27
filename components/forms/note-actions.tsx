"use client";

import { useState } from "react";
import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { deleteNoteAction, updateNoteAction } from "@/lib/ui/actions";
import { inputClass } from "@/components/forms/field";
import type { Note } from "@/lib/ui/types";

// Edit and delete for a single note. Deliberately two clicks to remove one:
// notes are the only record of a phone call or a viewing's feedback, and
// there's no undo behind this.
export function NoteActions({
  note,
  revalidatePaths,
}: {
  note: Note;
  revalidatePaths: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const editAction = updateNoteAction.bind(null, note.id, revalidatePaths);
  const removeAction = deleteNoteAction.bind(null, note.id, revalidatePaths);

  const edit = useMutationForm(editAction, () => setEditing(false));
  const remove = useMutationForm(removeAction);

  if (editing) {
    return (
      <form action={edit.formAction} className="mt-1 flex flex-col gap-2">
        <textarea
          name="body"
          required
          rows={3}
          defaultValue={note.body}
          className={inputClass}
        />
        {edit.state.status === "error" && (
          <p className="text-xs text-red-600">{edit.state.message}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={edit.pending}
            className="cursor-pointer rounded bg-navy-900 px-2 py-1 text-xs font-medium text-cream hover:bg-navy-800 disabled:opacity-50"
          >
            {edit.pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="cursor-pointer text-xs text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="cursor-pointer text-xs text-ink-faint hover:text-navy-900"
      >
        Edit
      </button>
      {confirming ? (
        <form action={remove.formAction} className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Delete this note?</span>
          <button
            type="submit"
            disabled={remove.pending}
            className="cursor-pointer text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {remove.pending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="cursor-pointer text-xs text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="cursor-pointer text-xs text-ink-faint hover:text-red-600"
        >
          Delete
        </button>
      )}
      {remove.state.status === "error" && (
        <span className="text-xs text-red-600">{remove.state.message}</span>
      )}
    </div>
  );
}
