import { OffersBoard } from "@/components/offers-board";

export default function LettingsApplicationsPage() {
  return (
    <OffersBoard
      listingType="lettings"
      basePath="/lettings/applications"
      heading="Applications"
      noteLabel="Enquiry"
      firmLabel="Application"
      emptyLabel="No enquiries or applications yet."
    />
  );
}
