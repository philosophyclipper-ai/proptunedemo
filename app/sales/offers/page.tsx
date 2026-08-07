import { OffersBoard } from "@/components/offers-board";

export default function SalesOffersPage() {
  return (
    <OffersBoard
      listingType="sales"
      heading="Offers Board"
      noteLabel="Note of Interest"
      firmLabel="Offer"
      emptyLabel="No offers or notes of interest yet."
    />
  );
}
