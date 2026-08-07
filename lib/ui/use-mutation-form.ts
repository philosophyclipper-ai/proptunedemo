"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initialActionState, type ActionState } from "@/lib/ui/action-state";

export function useMutationForm(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  onSuccess?: () => void
) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.redirectTo) {
      router.push(state.redirectTo);
    } else {
      router.refresh();
    }
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action actually resolves
  }, [state]);

  return { state, formAction, pending };
}
