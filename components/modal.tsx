"use client";

import { useState, type ReactNode } from "react";

// Deliberately no backdrop-click or Escape-to-close — these forms often
// hold partly-typed data (e.g. a vendor's email mid-entry), and losing it
// to a stray click or keypress is worse than a slightly less "standard"
// modal. The X button and completing the form are the only ways out.
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

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-paper p-6 shadow-xl">
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
