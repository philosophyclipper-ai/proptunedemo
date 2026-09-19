"use client";

import { useState, type MouseEvent } from "react";

// A testing affordance, not a CRM feature. Every n8n/Vapi tool call addresses
// a record by its uuid, so the uuid needs to be readable and one click from
// the clipboard while a workflow is being built. Properties are the
// exception — they're addressed by `ref` everywhere (CLAUDE.md), so their
// chip carries the ref and the uuid stays unexposed.
export function CopyId({
  value,
  label = "ID",
  truncate = false,
}: {
  value: string;
  label?: string;
  truncate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(event: MouseEvent<HTMLButtonElement>) {
    // These chips sit inside modal triggers and card links — copying must
    // not also open the row behind them.
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // navigator.clipboard is undefined outside a secure context (plain
      // http://<lan-ip>:3000 while testing from a phone, most likely).
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label ? `Copy ${label} — ${value}` : `Copy ${value}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded border border-border-hairline bg-cream px-1.5 py-0.5 text-left align-middle hover:border-amber-500"
    >
      {label && (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {label}
        </span>
      )}
      <span className="truncate font-mono text-[11px] text-ink-muted">
        {copied ? "Copied" : truncate ? `${value.slice(0, 8)}…` : value}
      </span>
    </button>
  );
}
