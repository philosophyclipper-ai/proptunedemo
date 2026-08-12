"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { updateMaintenanceAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import type { MaintenanceIssue } from "@/lib/ui/types";

const STATUSES = [
  { value: "reported", label: "Reported" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];
const URGENCIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

export function EditMaintenanceFieldsForm({
  issue,
  revalidatePaths,
}: {
  issue: MaintenanceIssue;
  revalidatePaths: string[];
}) {
  const action = updateMaintenanceAction.bind(null, issue.id, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Description">
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={issue.description}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select name="status" defaultValue={issue.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Urgency">
          <select name="urgency" defaultValue={issue.urgency ?? "normal"} className={inputClass}>
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
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
