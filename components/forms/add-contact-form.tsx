"use client";

import { useBackgroundMutation } from "@/lib/ui/use-background-mutation";
import { createContactAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { PhoneField } from "@/components/forms/phone-field";

const ROLE_OPTIONS: Record<"sales" | "lettings", { value: string; label: string }[]> = {
  sales: [
    { value: "vendor", label: "Vendor" },
    { value: "buyer", label: "Buyer" },
    { value: "solicitor", label: "Solicitor" },
  ],
  lettings: [
    { value: "landlord", label: "Landlord" },
    { value: "tenant", label: "Tenant" },
    { value: "applicant", label: "Applicant" },
    { value: "contractor", label: "Contractor" },
  ],
};

export function AddContactForm({
  section,
  onSuccess,
}: {
  section: "sales" | "lettings";
  onSuccess: () => void;
}) {
  const action = createContactAction.bind(null, section);
  // Closes on submit and saves in the background — see useBackgroundMutation.
  const { formProps } = useBackgroundMutation(action, {
    onSubmitted: onSuccess,
    pendingMessage: "Adding contact…",
    successMessage: "Contact added",
  });

  return (
    <form {...formProps} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input name="name" required className={inputClass} />
        </Field>
        <PhoneField name="phone_primary" label="Phone" required />
        <Field label="Email">
          <input name="email" type="email" className={inputClass} />
        </Field>
        <Field label="Company">
          <input name="company" className={inputClass} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-ink-muted">Roles</p>
        <div className="flex flex-wrap gap-3">
          {ROLE_OPTIONS[section].map((role) => (
            <label key={role.value} className="flex items-center gap-1.5 text-sm text-ink">
              <input type="checkbox" name="roles" value={role.value} />
              {role.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800"
      >
        Add Contact
      </button>
    </form>
  );
}
