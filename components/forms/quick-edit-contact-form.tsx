"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateContactAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import type { Contact } from "@/lib/ui/types";

// Embedded inside viewing/offer detail modals — deliberately omits roles
// (no roles_editable marker), so this can't clobber a contact's role set
// from a context that isn't about managing who they are to the agency.
export function QuickEditContactForm({
  contact,
  revalidatePaths,
}: {
  contact: Contact;
  revalidatePaths: string[];
}) {
  const action = updateContactAction.bind(null, contact.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Field label="Name">
          <input name="name" required defaultValue={contact.name} className={inputClass} />
        </Field>
        <Field label="Phone">
          <input
            name="phone_primary"
            required
            defaultValue={contact.phone_primary}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
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
