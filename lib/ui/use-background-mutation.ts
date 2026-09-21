"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-host";
import { initialActionState, type ActionState } from "@/lib/ui/action-state";

// The optimistic sibling of useMutationForm. That hook keeps the form on
// screen until the server action resolves, which on this stack means waiting
// for a write that hops through /api/v1 and then a full page re-render — one
// to three seconds of staring at a modal.
//
// Here the modal closes the moment the form is submitted and the write
// continues in the background, reporting through the toast host. The record
// is not shown as saved until it actually is: the toast sits in a pending
// state, turns into a confirmation on success, and on failure stays on screen
// with a Retry that replays the very same FormData.
//
// Browser constraint validation still runs first — required fields and the
// like block submission before this ever fires — so the common failure is a
// server-side rejection (a duplicate phone number, say), not a typo.
export function useBackgroundMutation(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  {
    onSubmitted,
    pendingMessage,
    successMessage,
  }: {
    onSubmitted?: () => void;
    pendingMessage: string;
    successMessage: string;
  }
) {
  const router = useRouter();
  const { show, update } = useToast();

  async function run(formData: FormData, toastId: number) {
    const fail = (message: string) =>
      update(toastId, {
        status: "error",
        message,
        onRetry: () => {
          const retryId = show({ status: "pending", message: pendingMessage });
          void run(formData, retryId);
        },
      });

    try {
      const result = await action(initialActionState, formData);
      if (result.status === "error") {
        fail(result.message ?? "Something went wrong");
        return;
      }
      // redirectTo becomes an Open link rather than a navigation — the user
      // has already moved on by the time this lands, and yanking them to
      // another page a second later would be worse than not going at all.
      update(toastId, { status: "success", message: successMessage, href: result.redirectTo });
      router.refresh();
    } catch (err) {
      fail(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmitted?.();
    const toastId = show({ status: "pending", message: pendingMessage });
    void run(formData, toastId);
  }

  return { formProps: { onSubmit } };
}
