"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createOfferAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";

const RECEIVED_VIA = [
  { value: "in_person", label: "In Person" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "ai_voice", label: "AI Voice" },
  { value: "portal", label: "Portal" },
];

export function AddOfferForm({
  propertyRef,
  listingType,
  onSuccess,
}: {
  propertyRef: string;
  listingType: "sales" | "lettings";
  onSuccess: () => void;
}) {
  const isLettings = listingType === "lettings";
  const action = createOfferAction.bind(null, propertyRef, listingType);
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

      <div className="grid grid-cols-2 gap-3">
        <Field label={isLettings ? "Proposed Rent (£, optional)" : "Amount (£, optional)"}>
          <input name="amount" type="number" min={0} step="1" className={inputClass} />
        </Field>
        <Field label="Received Via">
          <select name="received_via" defaultValue="in_person" className={inputClass}>
            {RECEIVED_VIA.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-xs text-ink-faint">
        Leave the amount blank to log it as a {isLettings ? "enquiry" : "note of interest"} rather
        than a firm {isLettings ? "application" : "offer"}.
      </p>

      {!isLettings && (
        <div className="rounded border border-border-hairline bg-cream p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Solicitor (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input name="solicitor_name" className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="solicitor_phone" className={inputClass} />
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
        {pending ? "Saving…" : isLettings ? "Add Application" : "Add Offer"}
      </button>
    </form>
  );
}
