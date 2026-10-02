"use client";

import { useState } from "react";
import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { saveViewingFeedbackAction } from "@/lib/ui/actions";
import { inputClass } from "@/components/forms/field";
import { formatDateTime } from "@/lib/ui/format";
import type { Viewing } from "@/lib/ui/types";

// How the viewing went: one entry, shown on the property page under the
// viewing. Writing again replaces it rather than adding a second — which is
// the whole point of splitting it from progress notes.
export function ViewingFeedbackForm({
  viewing,
  revalidatePaths,
}: {
  viewing: Viewing;
  revalidatePaths: string[];
}) {
  const [editing, setEditing] = useState(false);
  const { state, formAction, pending } = useMutationForm(
    saveViewingFeedbackAction.bind(null, viewing.id, revalidatePaths),
    () => setEditing(false)
  );

  if (!editing) {
    return (
      <div className="rounded border border-border-hairline bg-cream p-2">
        {viewing.feedback ? (
          <>
            <p className="whitespace-pre-wrap text-sm text-ink">{viewing.feedback}</p>
            {viewing.feedback_at && (
              <p className="mt-1 text-xs text-ink-faint">{formatDateTime(viewing.feedback_at)}</p>
            )}
          </>
        ) : viewing.status === "awaiting_feedback" ? (
          // The viewing has happened and nobody has said how it went, which is
          // the one state that needs chasing.
          <p className="text-sm text-ink-muted">
            This viewing has been and gone — adding feedback marks it completed.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">No feedback recorded yet.</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 cursor-pointer text-xs text-ink-faint hover:text-navy-900"
        >
          {viewing.feedback ? "Replace feedback" : "Add feedback"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="feedback"
        required
        rows={3}
        defaultValue={viewing.feedback ?? ""}
        placeholder="How did the viewing go?"
        className={inputClass}
      />
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream hover:bg-navy-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Feedback"}
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
