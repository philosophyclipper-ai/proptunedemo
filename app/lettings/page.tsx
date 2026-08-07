import Link from "next/link";
import { getProperties } from "@/lib/ui/api-client";
import { PropertyGrid } from "@/components/property-grid";
import { ListingsFilterForm } from "@/components/listings-filter-form";
import { AddListingButton } from "@/components/add-listing-button";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "on_market", label: "On the Market" },
  { value: "let", label: "Let" },
];

export default async function LettingsListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; postcode?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const { properties, next_cursor } = await getProperties({
    listing_type: "lettings",
    status: params.status,
    postcode: params.postcode,
    cursor: params.cursor,
  });

  const nextQuery: Record<string, string> = {};
  if (params.status) nextQuery.status = params.status;
  if (params.postcode) nextQuery.postcode = params.postcode;
  if (next_cursor) nextQuery.cursor = next_cursor;

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">Lettings Listings</h1>
          <p className="text-sm text-ink-muted">{properties.length} properties on this page</p>
        </div>
        <AddListingButton listingType="lettings" />
      </header>

      <ListingsFilterForm
        basePath="/lettings"
        statusOptions={STATUS_OPTIONS}
        status={params.status}
        postcode={params.postcode}
      />

      <PropertyGrid properties={properties} />

      {next_cursor && (
        <div className="mt-8 flex justify-center">
          <Link
            href={{ pathname: "/lettings", query: nextQuery }}
            className="rounded border border-border-hairline bg-paper px-4 py-2 text-sm font-medium text-navy-900 hover:bg-cream-dim"
          >
            Next page →
          </Link>
        </div>
      )}
    </div>
  );
}
