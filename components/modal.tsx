"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Modal({
  trigger,
  title,
  children,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4"
          onClick={close}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-navy-950">{title}</h2>
              <button
                type="button"
                onClick={close}
                className="cursor-pointer text-ink-muted hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {children(close)}
          </div>
        </div>
      )}
    </>
  );
}
