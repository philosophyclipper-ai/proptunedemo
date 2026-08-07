"use client";

import { Modal } from "@/components/modal";
import { ListingForm } from "@/components/forms/listing-form";
import type { Property } from "@/lib/ui/types";

export function EditListingButton({
  property,
  vendorName,
  vendorPhone,
  viewingNotes,
}: {
  property: Property;
  vendorName?: string;
  vendorPhone?: string;
  viewingNotes?: string | null;
}) {
  return (
    <Modal
      title="Edit Listing"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded border border-border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-cream-dim"
        >
          Edit Listing
        </button>
      )}
    >
      {(close) => (
        <ListingForm
          mode="edit"
          listingType={property.listing_type}
          property={property}
          vendorName={vendorName}
          vendorPhone={vendorPhone}
          viewingNotes={viewingNotes}
          onSuccess={close}
        />
      )}
    </Modal>
  );
}
