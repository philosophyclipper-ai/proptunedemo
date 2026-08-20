import Link from "next/link";
import { getProperties, getUsers } from "@/lib/ui/api-client";
import { PropertyGrid } from "@/components/property-grid";
import { ListingsFilterForm } from "@/components/listings-filter-form";
import { AddListingButton } from "@/components/add-listing-button";
import { AddContactButton } from "@/components/add-contact-button";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "valued", label: "Valued" },
  { value: "instructed", label: "Instructed" },
  { value: "available", label: "Available" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

const DEFAULT_STATUS = "available";

export default async function SalesListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  // No status in the URL yet = first visit, default to what's actively on
  // the market. An explicit empty string means the negotiator chose "All
  // statuses" and that should stick, not silently re-default.
  const resolvedStatus = params.status ?? DEFAULT_STATUS;

  const [{ properties, next_cursor }, { users }] = await Promise.all([
    getProperties({
      listing_type: "sales",
      status: resolvedStatus,
      q: params.q,
      cursor: params.cursor,
    }),
    getUsers(),
  ]);

  const nextQuery: Record<string, string> = { status: resolvedStatus };
  if (params.q) nextQuery.q = params.q;
  if (next_cursor) nextQuery.cursor = next_cursor;

  const showClear = params.status !== undefined || Boolean(params.q);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">Sales Listings</h1>
          <p className="text-sm text-ink-muted">{properties.length} properties on this page</p>
        </div>
        <div className="flex gap-2">
          <AddContactButton section="sales" />
          <AddListingButton listingType="sales" users={users} />
        </div>
      </header>

      <ListingsFilterForm
        basePath="/sales"
        statusOptions={STATUS_OPTIONS}
        status={resolvedStatus}
        q={params.q}
        showClear={showClear}
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
