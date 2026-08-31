"use client";

import { useState } from "react";
import { toE164Phone } from "@/lib/api/phone";
import { Field, inputClass } from "@/components/forms/field";

// Client-side check on blur, reusing the exact same validator the server
// enforces — a live nudge, not the authoritative gate. The server always
// re-validates regardless of what this shows, so there's no path (direct
// API call, JS disabled, a stale bundle) where this being skipped lets bad
// data through.
export function PhoneField({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function validate(value: string) {
    if (!value.trim()) {
      setError(null);
      return;
    }
    const result = toE164Phone(value);
    setError("error" in result ? result.error : null);
  }

  return (
    <Field label={label}>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        onBlur={(e) => validate(e.target.value)}
        className={inputClass}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </Field>
  );
}
