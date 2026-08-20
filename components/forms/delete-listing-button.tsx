"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { deleteListingAction } from "@/lib/ui/actions";

// Lives at the bottom of the Edit Listing form, away from routine edits.
// Deletes the property and everything attached to it (viewings, offers,
// maintenance issues, their notes/tasks) — valuations are decoupled rather
// than deleted, since they can exist independently of a property.
export function DeleteListingButton({
  propertyRef,
  listingType,
  addressLine1,
}: {
  propertyRef: string;
  listingType: "sales" | "lettings";
  addressLine1: string;
}) {
  const action = deleteListingAction.bind(null, propertyRef, listingType);
  const { formAction, pending } = useMutationForm(action);

  return (
    <div className="border-t border-border-hairline pt-4">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (
            !window.confirm(
              `Delete ${addressLine1} (${propertyRef}) entirely? This removes the listing along with all its viewings, offers and maintenance issues. This cannot be undone.`
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete Listing"}
        </button>
      </form>
    </div>
  );
}
