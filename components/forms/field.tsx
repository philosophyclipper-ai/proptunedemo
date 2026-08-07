import type { ReactNode } from "react";

export const inputClass =
  "rounded border border-border-hairline bg-cream px-2 py-1.5 text-sm text-ink";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
