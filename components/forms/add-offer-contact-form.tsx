"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { addOfferContactAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";

export function AddOfferContactForm({
  offerId,
  listingType,
  revalidatePaths,
}: {
  offerId: string;
  listingType: "sales" | "lettings";
  revalidatePaths: string[];
}) {
  const roles = [listingType === "lettings" ? "applicant" : "buyer"];
  const action = addOfferContactAction.bind(null, offerId, roles, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Name">
          <input name="contact_name" required className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="contact_phone" required className={inputClass} />
        </Field>
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded border border-border-hairline bg-paper px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-cream-dim disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "+ Add Contact"}
      </button>
    </form>
  );
}
