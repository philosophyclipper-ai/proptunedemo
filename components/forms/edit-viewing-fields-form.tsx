"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateViewingAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { utcIsoToLondonWallTimeInputValue } from "@/lib/ui/timezone";
import { formatDateTime } from "@/lib/ui/format";
import type { Viewing } from "@/lib/ui/types";

export function EditViewingFieldsForm({
  viewing,
  revalidatePaths,
}: {
  viewing: Viewing;
  revalidatePaths: string[];
}) {
  const action = updateViewingAction.bind(null, viewing.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);
  const isActive =
    viewing.status === "requested" ||
    viewing.status === "confirmed" ||
    viewing.status === "incomplete";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {viewing.status === "incomplete" && (
        <p className="text-xs text-ink-faint">
          No viewing time on file yet — add one below to move this out of incomplete.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 items-end">
        {isActive && (
          <>
            <input type="hidden" name="confirmed_editable" value="1" />
            <label className="flex items-center gap-2 pb-2 text-sm text-ink">
              <input
                type="checkbox"
                name="confirmed"
                defaultChecked={viewing.status === "confirmed"}
                className="h-4 w-4"
              />
              Confirmed
            </label>
          </>
        )}
        <Field label="Scheduled Time">
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={utcIsoToLondonWallTimeInputValue(viewing.scheduled_at)}
            className={inputClass}
          />
        </Field>
      </div>
      {viewing.proposed_times && viewing.proposed_times.length > 0 && (
        <p className="text-xs text-ink-faint">
          Proposed times on file: {viewing.proposed_times.map(formatDateTime).join(", ")}
        </p>
      )}
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
