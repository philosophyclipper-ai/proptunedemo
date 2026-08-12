"use client";

import { Modal } from "@/components/modal";
import { EditContactForm } from "@/components/forms/edit-contact-form";
import type { Contact } from "@/lib/ui/types";

export function EditContactButton({ contact }: { contact: Contact }) {
  return (
    <Modal
      title="Edit Contact"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim"
        >
          Edit Contact
        </button>
      )}
    >
      {(close) => <EditContactForm contact={contact} onSuccess={close} />}
    </Modal>
  );
}
