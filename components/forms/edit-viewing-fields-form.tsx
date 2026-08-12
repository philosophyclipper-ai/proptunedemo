"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateViewingAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import type { Viewing } from "@/lib/ui/types";

const STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditViewingFieldsForm({
  viewing,
  revalidatePaths,
}: {
  viewing: Viewing;
  revalidatePaths: string[];
}) {
  const action = updateViewingAction.bind(null, viewing.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select name="status" defaultValue={viewing.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Scheduled Time">
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(viewing.scheduled_at)}
            className={inputClass}
          />
        </Field>
      </div>
      {viewing.proposed_times && viewing.proposed_times.length > 0 && (
        <p className="text-xs text-ink-faint">
          Proposed times on file:{" "}
          {viewing.proposed_times.map((t) => new Date(t).toLocaleString("en-GB")).join(", ")}
        </p>
      )}
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
