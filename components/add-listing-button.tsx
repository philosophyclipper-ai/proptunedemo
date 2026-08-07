"use client";

import { Modal } from "@/components/modal";
import { ListingForm } from "@/components/forms/listing-form";

export function AddListingButton({ listingType }: { listingType: "sales" | "lettings" }) {
  return (
    <Modal
      title={listingType === "lettings" ? "Add Lettings Listing" : "Add Sales Listing"}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="cursor-pointer rounded bg-amber-500 px-4 py-1.5 text-sm font-medium text-navy-950 hover:bg-amber-400"
        >
          + Add Listing
        </button>
      )}
    >
      {(close) => <ListingForm mode="create" listingType={listingType} onSuccess={close} />}
    </Modal>
  );
}
