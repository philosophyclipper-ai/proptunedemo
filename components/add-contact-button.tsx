"use client";

import { Modal } from "@/components/modal";
import { AddContactForm } from "@/components/forms/add-contact-form";

export function AddContactButton({ section }: { section: "sales" | "lettings" }) {
  return (
    <Modal
      title="Add Contact"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded border border-border-hairline bg-paper px-4 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim"
        >
          + Add Contact
        </button>
      )}
    >
      {(close) => <AddContactForm section={section} onSuccess={close} />}
    </Modal>
  );
}
