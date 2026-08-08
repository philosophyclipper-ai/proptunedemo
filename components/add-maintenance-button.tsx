"use client";

import { Modal } from "@/components/modal";
import { AddMaintenanceForm } from "@/components/forms/add-maintenance-form";

export function AddMaintenanceButton({ propertyRef }: { propertyRef: string }) {
  return (
    <Modal
      title="Log Maintenance Issue"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim"
        >
          + Log Maintenance
        </button>
      )}
    >
      {(close) => <AddMaintenanceForm propertyRef={propertyRef} onSuccess={close} />}
    </Modal>
  );
}
