"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createViewingAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";

export function AddViewingForm({
  propertyRef,
  listingType,
  onSuccess,
}: {
  propertyRef: string;
  listingType: "sales" | "lettings";
  onSuccess: () => void;
}) {
  const action = createViewingAction.bind(null, propertyRef, listingType);
  const { state, formAction, pending } = useMutationForm(action, onSuccess);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Name">
          <input name="contact_name" required className={inputClass} />
        </Field>
        <Field label="Contact Phone">
          <input name="contact_phone" required className={inputClass} />
        </Field>
      </div>
      <Field label="Contact Email (optional)">
        <input name="contact_email" type="email" className={inputClass} />
      </Field>

      <p className="text-xs text-ink-faint">
        Check the property&apos;s viewing notes to see who arranges viewings and how. If a time
        can be booked directly, use Scheduled Time. If it needs to be put to someone first, use
        Proposed Times instead. Leave both blank to log this as incomplete and add a time later.
      </p>
      <Field label="Scheduled Time (optional)">
        <input name="scheduled_at" type="datetime-local" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Proposed Time 1 (optional)">
          <input name="proposed_time_1" type="datetime-local" className={inputClass} />
        </Field>
        <Field label="Proposed Time 2 (optional)">
          <input name="proposed_time_2" type="datetime-local" className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="confirmed" className="h-4 w-4" />
        Confirmed
      </label>
      <p className="-mt-2 text-xs text-ink-faint">
        Leave unchecked to book as requested, pending approval. A time is required before a
        viewing can be requested or confirmed — without one it&apos;s logged as incomplete.
      </p>

      <Field label="Notes (optional)">
        <textarea name="notes" rows={2} className={inputClass} />
      </Field>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Viewing"}
      </button>
    </form>
  );
}
