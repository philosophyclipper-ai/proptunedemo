import Link from "next/link";
import { getProperties } from "@/lib/ui/api-client";
import { PropertyGrid } from "@/components/property-grid";
import { ListingsFilterForm } from "@/components/listings-filter-form";
import { AddListingButton } from "@/components/add-listing-button";
import { AddContactButton } from "@/components/add-contact-button";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default async function SalesListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; postcode?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const { properties, next_cursor } = await getProperties({
    listing_type: "sales",
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
          <h1 className="font-heading text-2xl font-semibold text-navy-950">Sales Listings</h1>
          <p className="text-sm text-ink-muted">{properties.length} properties on this page</p>
        </div>
        <div className="flex gap-2">
          <AddContactButton section="sales" />
          <AddListingButton listingType="sales" />
        </div>
      </header>

      <ListingsFilterForm
        basePath="/sales"
        statusOptions={STATUS_OPTIONS}
        status={params.status}
        postcode={params.postcode}
      />

      <PropertyGrid properties={properties} />

      {next_cursor && (
        <div className="mt-8 flex justify-center">
          <Link
            href={{ pathname: "/sales", query: nextQuery }}
            className="rounded border border-border-hairline bg-paper px-4 py-2 text-sm font-medium text-navy-900 hover:bg-cream-dim"
          >
            Next page →
          </Link>
        </div>
      )}
    </div>
  );
}
