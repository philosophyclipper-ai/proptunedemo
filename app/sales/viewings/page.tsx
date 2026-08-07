import { ViewingsWeekView } from "@/components/viewings-week-view";

export default async function SalesViewingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  return <ViewingsWeekView listingType="sales" basePath="/sales/viewings" week={week} />;
}
