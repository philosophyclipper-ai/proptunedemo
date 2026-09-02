"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateContactAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { PhoneField } from "@/components/forms/phone-field";
import type { Contact } from "@/lib/ui/types";

const ALL_ROLES = [
  { value: "vendor", label: "Vendor" },
  { value: "landlord", label: "Landlord" },
  { value: "buyer", label: "Buyer" },
  { value: "tenant", label: "Tenant" },
  { value: "applicant", label: "Applicant" },
  { value: "solicitor", label: "Solicitor" },
  { value: "contractor", label: "Contractor" },
];

export function EditContactForm({
  contact,
  onSuccess,
}: {
  contact: Contact;
  onSuccess: () => void;
}) {
  const action = updateContactAction.bind(null, contact.id, [`/contacts/${contact.id}`]);
  const { state, formAction, pending } = useMutationForm(action, onSuccess);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="roles_editable" value="1" />
      <input type="hidden" name="additional_numbers_editable" value="1" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input name="name" required defaultValue={contact.name} className={inputClass} />
        </Field>
        <PhoneField name="phone_primary" label="Phone" required defaultValue={contact.phone_primary} />
        <PhoneField
          name="phone_secondary"
          label="Secondary Phone"
          defaultValue={contact.phone_secondary ?? ""}
        />
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Company">
          <input name="company" defaultValue={contact.company ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Additional Numbers">
        <textarea
          name="additional_numbers"
          rows={2}
          placeholder="One per line — a second mobile, a partner's number…"
          defaultValue={contact.additional_numbers.join("\n")}
          className={inputClass}
        />
      </Field>
      <p className="-mt-2 text-xs text-ink-faint">
        A number here still resolves to this contact everywhere phone lookup happens — use it for
        a shared landline instead of creating a second contact for the same household.
      </p>

      <div>
        <p className="mb-2 text-xs font-medium text-ink-muted">Roles</p>
        <div className="flex flex-wrap gap-3">
          {ALL_ROLES.map((role) => (
            <label key={role.value} className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="checkbox"
                name="roles"
                value={role.value}
                defaultChecked={contact.roles.includes(role.value)}
              />
              {role.label}
            </label>
          ))}
        </div>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
