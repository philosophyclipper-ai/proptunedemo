"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateContactAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { PhoneField } from "@/components/forms/phone-field";
import { MORTGAGE_STATUS_OPTIONS, PROPERTY_OWNERSHIP_STATUS_OPTIONS } from "@/lib/ui/buyer-position";
import type { Contact } from "@/lib/ui/types";

// Embedded inside viewing/offer detail modals — deliberately omits roles
// (no roles_editable marker), so this can't clobber a contact's role set
// from a context that isn't about managing who they are to the agency.
export function QuickEditContactForm({
  contact,
  revalidatePaths,
  showBuyerFields = false,
}: {
  contact: Contact;
  revalidatePaths: string[];
  showBuyerFields?: boolean;
}) {
  const action = updateContactAction.bind(null, contact.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {showBuyerFields && <input type="hidden" name="buyer_fields_editable" value="1" />}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Name">
          <input name="name" required defaultValue={contact.name} className={inputClass} />
        </Field>
        <PhoneField name="phone_primary" label="Phone" required defaultValue={contact.phone_primary} />
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
      {showBuyerFields && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Mortgage Status">
            <select
              name="mortgage_status"
              defaultValue={contact.mortgage_status ?? ""}
              className={inputClass}
            >
              <option value="">Not asked</option>
              {MORTGAGE_STATUS_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Property Ownership Status">
            <select
              name="property_ownership_status"
              defaultValue={contact.property_ownership_status ?? ""}
              className={inputClass}
            >
              <option value="">Not asked</option>
              {PROPERTY_OWNERSHIP_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded border border-border-hairline bg-paper px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-cream-dim disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update Contact"}
      </button>
    </form>
  );
}
