"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateOfferAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import type { Offer } from "@/lib/ui/types";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "countered", label: "Countered" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function EditOfferFieldsForm({
  offer,
  revalidatePaths,
}: {
  offer: Offer;
  revalidatePaths: string[];
}) {
  const action = updateOfferAction.bind(null, offer.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="previous_amount" value={offer.amount ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select name="status" defaultValue={offer.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount (£)">
          <input
            name="amount"
            type="number"
            min={0}
            step="1"
            defaultValue={offer.amount ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="text-xs text-ink-faint">
        Raising the amount automatically logs a note recording the increase.
      </p>
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
