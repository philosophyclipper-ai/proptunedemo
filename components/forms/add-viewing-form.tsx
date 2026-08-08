"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createViewingAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";

const MORTGAGE_STATUSES = [
  { value: "not_required", label: "Not Required" },
  { value: "mortgage_required", label: "Mortgage Required" },
  { value: "approved_in_principle", label: "Approved in Principle" },
];

const BUYER_PROPERTY_STATUSES = [
  { value: "first_time_buyer", label: "First Time Buyer" },
  { value: "chain_free", label: "Chain Free" },
  { value: "on_the_market", label: "On the Market" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
];

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

      {vendorLed ? (
        <>
          <p className="text-xs text-ink-faint">
            This property&apos;s calendar is held by the vendor/landlord — propose times rather
            than booking one directly.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proposed Time 1">
              <input name="proposed_time_1" type="datetime-local" required className={inputClass} />
            </Field>
            <Field label="Proposed Time 2 (optional)">
              <input name="proposed_time_2" type="datetime-local" className={inputClass} />
            </Field>
          </div>
        </>
      ) : (
        <Field label="Scheduled Time">
          <input name="scheduled_at" type="datetime-local" required className={inputClass} />
        </Field>
      )}

      {listingType === "sales" && (
        <div className="rounded border border-border-hairline bg-cream p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Buyer Position
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mortgage Status">
              <select name="mortgage_status" defaultValue="" className={inputClass}>
                <option value="">Not asked</option>
                {MORTGAGE_STATUSES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Their Property Status">
              <select name="buyer_property_status" defaultValue="" className={inputClass}>
                <option value="">Not asked</option>
                {BUYER_PROPERTY_STATUSES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

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
