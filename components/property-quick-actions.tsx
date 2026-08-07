"use client";

import { Modal } from "@/components/modal";
import { AddViewingForm } from "@/components/forms/add-viewing-form";
import { AddOfferForm } from "@/components/forms/add-offer-form";
import { AddMaintenanceForm } from "@/components/forms/add-maintenance-form";

const buttonClass =
  "cursor-pointer rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim";

export function PropertyQuickActions({
  propertyRef,
  listingType,
  vendorLed,
}: {
  propertyRef: string;
  listingType: "sales" | "lettings";
  vendorLed: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Modal
        title="Add Viewing"
        trigger={(open) => (
          <button type="button" onClick={open} className={buttonClass}>
            + Add Viewing
          </button>
        )}
      >
        {(close) => (
          <AddViewingForm
            propertyRef={propertyRef}
            listingType={listingType}
            vendorLed={vendorLed}
            onSuccess={close}
          />
        )}
      </Modal>

      <Modal
        title={listingType === "lettings" ? "Add Application" : "Add Offer"}
        trigger={(open) => (
          <button type="button" onClick={open} className={buttonClass}>
            + {listingType === "lettings" ? "Add Application" : "Add Offer"}
          </button>
        )}
      >
        {(close) => (
          <AddOfferForm propertyRef={propertyRef} listingType={listingType} onSuccess={close} />
        )}
      </Modal>

      {listingType === "lettings" && (
        <Modal
          title="Log Maintenance Issue"
          trigger={(open) => (
            <button type="button" onClick={open} className={buttonClass}>
              + Log Maintenance
            </button>
          )}
        >
          {(close) => <AddMaintenanceForm propertyRef={propertyRef} onSuccess={close} />}
        </Modal>
      )}
    </div>
  );
}
