"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

// Somewhere for a background write to report itself. Adding a contact or a
// viewing closes its modal on submit and finishes afterwards, so without this
// a failure would be invisible — the negotiator would carry on believing the
// record saved. Successes fade; errors stay put until dismissed and offer a
// retry, because the form they were typed into is long gone.

export type ToastStatus = "pending" | "success" | "error";

type Toast = {
  id: number;
  status: ToastStatus;
  message: string;
  href?: string;
  onRetry?: () => void;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  show: (toast: ToastInput) => number;
  update: (id: number, toast: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastHost>");
  return context;
}

const SUCCESS_DISMISS_MS = 4000;

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...toast, id }]);
    return id;
  }, []);

  const update = useCallback(
    (id: number, patch: Partial<ToastInput>) => {
      setToasts((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.status === "success") {
        window.setTimeout(() => dismiss(id), SUCCESS_DISMISS_MS);
      }
    },
    [dismiss]
  );

  const value = useMemo(() => ({ show, update, dismiss }), [show, update, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-lg border bg-paper p-3 shadow-lg ${
              toast.status === "error" ? "border-red-300" : "border-border-hairline"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm ${toast.status === "error" ? "text-red-700" : "text-ink"}`}
              >
                {toast.status === "pending" && (
                  <span className="mr-1.5 inline-block animate-pulse text-ink-faint">●</span>
                )}
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="cursor-pointer text-xs text-ink-faint hover:text-ink"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            {(toast.href || toast.onRetry) && (
              <div className="mt-2 flex gap-3">
                {toast.href && (
                  <Link
                    href={toast.href}
                    onClick={() => dismiss(toast.id)}
                    className="text-xs font-medium text-navy-900 hover:underline"
                  >
                    Open
                  </Link>
                )}
                {toast.onRetry && (
                  <button
                    type="button"
                    onClick={() => {
                      dismiss(toast.id);
                      toast.onRetry?.();
                    }}
                    className="cursor-pointer text-xs font-medium text-navy-900 hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
