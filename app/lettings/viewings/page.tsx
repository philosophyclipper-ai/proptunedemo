import { ViewingsWeekView } from "@/components/viewings-week-view";

export default async function LettingsViewingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  return <ViewingsWeekView listingType="lettings" basePath="/lettings/viewings" week={week} />;
}
