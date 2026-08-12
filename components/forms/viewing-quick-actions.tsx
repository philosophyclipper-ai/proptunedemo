"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { deleteViewingAction, updateViewingAction } from "@/lib/ui/actions";
import type { Viewing } from "@/lib/ui/types";

function StatusButton({
  viewing,
  revalidatePaths,
  status,
  label,
  className,
}: {
  viewing: Viewing;
  revalidatePaths: string[];
  status: "confirmed" | "cancelled";
  label: string;
  className: string;
}) {
  const action = updateViewingAction.bind(null, viewing.id, revalidatePaths);
  const { formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction}>
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}

export function ViewingQuickActions({
  viewing,
  revalidatePaths,
  onDeleted,
}: {
  viewing: Viewing;
  revalidatePaths: string[];
  onDeleted: () => void;
}) {
  const deleteAction = deleteViewingAction.bind(null, viewing.id, revalidatePaths);
  const { formAction: deleteFormAction, pending: deletePending } = useMutationForm(
    deleteAction,
    onDeleted
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {viewing.status === "requested" && (
        <>
          <StatusButton
            viewing={viewing}
            revalidatePaths={revalidatePaths}
            status="confirmed"
            label="Approve"
            className="cursor-pointer rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-cream hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <StatusButton
            viewing={viewing}
            revalidatePaths={revalidatePaths}
            status="cancelled"
            label="Decline"
            className="cursor-pointer rounded border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </>
      )}
      {viewing.status === "confirmed" && (
        <StatusButton
          viewing={viewing}
          revalidatePaths={revalidatePaths}
          status="cancelled"
          label="Cancel Viewing"
          className="cursor-pointer rounded border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}

      <form
        action={deleteFormAction}
        className="ml-auto"
        onSubmit={(e) => {
          if (!window.confirm("Delete this viewing entirely? This cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={deletePending}
          className="cursor-pointer rounded px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletePending ? "Deleting…" : "Delete Viewing"}
        </button>
      </form>
    </div>
  );
}
