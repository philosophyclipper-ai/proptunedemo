"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutationForm } from "@/lib/ui/use-mutation-form";
import { addVendorAction, removeVendorAction } from "@/lib/ui/actions";
import { Field, inputClass } from "@/components/forms/field";
import { CopyId } from "@/components/copy-id";
import { Pill } from "@/components/pill";
import type { PropertyVendor } from "@/lib/ui/types";

// A property can be sold by more than one person — a couple, most often —
// which properties.vendor_contact_id can't express on its own. This edits the
// vendors/vendor_contacts record that contacts/resolve actually reads, so a
// joint owner is recognised as a seller when they ring in.
export function PropertyVendors({
  propertyRef,
  vendors,
  isLettings,
}: {
  propertyRef: string;
  vendors: PropertyVendor[];
  isLettings: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const label = isLettings ? "Landlord" : "Vendor";
  const revalidatePaths = [`/properties/${propertyRef}`];

  const add = useMutationForm(
    addVendorAction.bind(null, propertyRef, revalidatePaths),
    () => setAdding(false)
  );

  return (
    <section className="rounded-lg border border-border-hairline bg-paper p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-navy-950">
          {vendors.length > 1 ? `${label}s` : label}
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="cursor-pointer rounded border border-border-hairline px-2 py-1 text-xs font-medium text-navy-900 hover:bg-cream-dim"
          >
            Add
          </button>
        )}
      </div>

      {vendors.length === 0 && !adding && (
        <p className="text-sm text-ink-muted">No {label.toLowerCase()} on file.</p>
      )}

      <ul className="flex flex-col gap-3">
        {vendors.map((vendor) => (
          <li key={vendor.contact_id} className="border-b border-border-hairline pb-3 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/contacts/${vendor.contact_id}`} className="min-w-0 hover:underline">
                <p className="font-medium text-navy-950">{vendor.name}</p>
                <p className="text-sm text-ink-muted">{vendor.phone}</p>
                {vendor.email && <p className="truncate text-sm text-ink-muted">{vendor.email}</p>}
              </Link>
              {vendor.is_primary && <Pill tone="navy" label="Primary" />}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <CopyId value={vendor.contact_id} label="Contact ID" truncate />
              <RemoveVendor
                propertyRef={propertyRef}
                contactId={vendor.contact_id}
                name={vendor.name}
                revalidatePaths={revalidatePaths}
              />
            </div>
          </li>
        ))}
      </ul>

      {adding && (
        <form action={add.formAction} className="mt-3 flex flex-col gap-2 border-t border-border-hairline pt-3">
          <p className="text-xs text-ink-faint">
            An existing contact on this number is reused, not duplicated.
          </p>
          <Field label="Name">
            <input name="vendor_name" required className={inputClass} />
          </Field>
          <Field label="Phone">
            <input name="vendor_phone" required className={inputClass} />
          </Field>
          <Field label="Email (optional)">
            <input name="vendor_email" type="email" className={inputClass} />
          </Field>
          {add.state.status === "error" && (
            <p className="text-xs text-red-600">{add.state.message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={add.pending}
              className="cursor-pointer rounded bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream hover:bg-navy-800 disabled:opacity-50"
            >
              {add.pending ? "Saving…" : `Add ${label}`}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="cursor-pointer text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function RemoveVendor({
  propertyRef,
  contactId,
  name,
  revalidatePaths,
}: {
  propertyRef: string;
  contactId: string;
  name: string;
  revalidatePaths: string[];
}) {
  const [confirming, setConfirming] = useState(false);
  const remove = useMutationForm(
    removeVendorAction.bind(null, propertyRef, contactId, revalidatePaths)
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer text-xs text-ink-faint hover:text-red-600"
      >
        Remove
      </button>
    );
  }

  return (
    <form action={remove.formAction} className="flex items-center gap-2">
      {/* The contact stays on file — they may be a buyer elsewhere. */}
      <span className="text-xs text-ink-muted">Remove {name} as seller?</span>
      <button
        type="submit"
        disabled={remove.pending}
        className="cursor-pointer text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {remove.pending ? "Removing…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer text-xs text-ink-muted hover:text-ink"
      >
        Cancel
      </button>
      {remove.state.status === "error" && (
        <span className="text-xs text-red-600">{remove.state.message}</span>
      )}
    </form>
  );
}
