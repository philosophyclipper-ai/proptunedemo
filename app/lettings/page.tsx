import Link from "next/link";
import { getProperties, getUsers } from "@/lib/ui/api-client";
import { PropertyGrid } from "@/components/property-grid";
import { ListingsFilterForm } from "@/components/listings-filter-form";
import { AddListingButton } from "@/components/add-listing-button";
import { AddContactButton } from "@/components/add-contact-button";
import { ContactSearchBar } from "@/components/contact-search-bar";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "on_market", label: "On the Market" },
  { value: "let", label: "Let" },
];

const DEFAULT_STATUS = "on_market";

export default async function LettingsListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  // No status in the URL yet = first visit, default to what's actively to
  // let. An explicit empty string means the negotiator chose "All statuses"
  // and that should stick, not silently re-default.
  const resolvedStatus = params.status ?? DEFAULT_STATUS;

  const [{ properties, next_cursor }, { users }] = await Promise.all([
    getProperties({
      listing_type: "lettings",
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
          <h1 className="font-heading text-2xl font-semibold text-navy-950">Lettings Listings</h1>
          <p className="text-sm text-ink-muted">{properties.length} properties on this page</p>
        </div>
        <div className="flex items-center gap-2">
          <ContactSearchBar />
          <AddContactButton section="lettings" />
          <AddListingButton listingType="lettings" users={users} />
        </div>
      </header>

      <ListingsFilterForm
        basePath="/lettings"
        statusOptions={STATUS_OPTIONS}
        status={resolvedStatus}
        q={params.q}
        showClear={showClear}
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
