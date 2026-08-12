"use client";

import { useEffect, useRef } from "react";
import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { addNoteAction } from "@/lib/ui/actions";
import { inputClass } from "@/components/forms/field";

export function AddNoteForm({
  entityType,
  entityId,
  revalidatePaths,
}: {
  entityType: string;
  entityId: string;
  revalidatePaths: string[];
}) {
  const action = addNoteAction.bind(null, entityType, entityId, revalidatePaths);
  const { state, formAction, pending } = useMutationForm(action);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <textarea name="body" required rows={2} placeholder="Add a note…" className={inputClass} />
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add Note"}
      </button>
    </form>
  );
}
