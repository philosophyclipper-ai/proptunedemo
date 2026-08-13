"use client";

import { Modal } from "@/components/modal";
import { ListingForm } from "@/components/forms/listing-form";
import type { Property, User } from "@/lib/ui/types";

export function EditListingButton({
  property,
  vendorName,
  vendorPhone,
  vendorEmail,
  viewingNotes,
  users,
}: {
  property: Property;
  vendorName?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  viewingNotes?: string | null;
  users: User[];
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
          vendorEmail={vendorEmail}
          viewingNotes={viewingNotes}
          users={users}
          onSuccess={close}
        />
      )}
    </Modal>
  );
}
