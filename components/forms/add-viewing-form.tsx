"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createViewingAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { MORTGAGE_STATUS_OPTIONS, PROPERTY_OWNERSHIP_STATUS_OPTIONS } from "@/lib/ui/buyer-position";

export function AddViewingForm({
  propertyRef,
  listingType,
  vendorLed,
  onSuccess,
}: {
  propertyRef: string;
  listingType: "sales" | "lettings";
  vendorLed: boolean;
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

      {vendorLed ? (
        <>
          <p className="text-xs text-ink-faint">
            This property&apos;s calendar is held by the{" "}
            {listingType === "lettings" ? "landlord" : "vendor"} — propose times rather than
            booking one directly. Leave blank to log this as incomplete and add times later.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proposed Time 1 (optional)">
              <input name="proposed_time_1" type="datetime-local" className={inputClass} />
            </Field>
            <Field label="Proposed Time 2 (optional)">
              <input name="proposed_time_2" type="datetime-local" className={inputClass} />
            </Field>
          </div>
        </>
      ) : (
        <Field label="Scheduled Time (optional)">
          <input name="scheduled_at" type="datetime-local" className={inputClass} />
          <p className="mt-1 text-xs text-ink-faint">
            Leave blank to log this as incomplete and add a time later.
          </p>
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="confirmed" className="h-4 w-4" />
        Confirmed
      </label>
      <p className="-mt-2 text-xs text-ink-faint">
        Leave unchecked to book as requested, pending approval. A time is required before a
        viewing can be requested or confirmed — without one it&apos;s logged as incomplete.
      </p>

      {listingType === "sales" && (
        <div className="rounded border border-border-hairline bg-cream p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Buyer Position
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mortgage Status">
              <select name="mortgage_status" defaultValue="" className={inputClass}>
                <option value="">Not asked</option>
                {MORTGAGE_STATUS_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Their Property Status">
              <select name="buyer_property_status" defaultValue="" className={inputClass}>
                <option value="">Not asked</option>
                {PROPERTY_OWNERSHIP_STATUS_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      <Field label="Notes (optional)">
        <textarea name="notes" rows={2} className={inputClass} />
      </Field>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : vendorLed ? "Propose Viewing" : "Book Viewing"}
      </button>
    </form>
  );
}
