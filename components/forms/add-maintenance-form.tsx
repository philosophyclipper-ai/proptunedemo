"use client";

import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { createMaintenanceAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";

const URGENCIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

export function AddMaintenanceForm({
  propertyRef,
  onSuccess,
}: {
  propertyRef: string;
  onSuccess: () => void;
}) {
  const action = createMaintenanceAction.bind(null, propertyRef);
  const { state, formAction, pending } = useMutationForm(action, onSuccess);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Description">
        <textarea name="description" required rows={3} className={inputClass} />
      </Field>
      <Field label="Urgency">
        <select name="urgency" defaultValue="normal" className={inputClass}>
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="rounded border border-border-hairline bg-cream p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Reported By (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input name="contact_name" className={inputClass} />
          </Field>
          <Field label="Phone">
            <input name="contact_phone" className={inputClass} />
          </Field>
        </div>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded bg-navy-900 px-4 py-2 text-sm font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Log Issue"}
      </button>
    </form>
  );
}
