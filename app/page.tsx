import Link from "next/link";
import { getProperties } from "@/lib/ui/api-client";
import { formatPrice, titleCase } from "@/lib/ui/format";
import { propertyStatusTone } from "@/lib/ui/status-tone";
import { Pill } from "@/components/pill";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; postcode?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const { properties, next_cursor } = await getProperties({
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
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">Listings</h1>
        <p className="text-sm text-ink-muted">{properties.length} properties on this page</p>
      </header>

      <form
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-hairline bg-paper p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-muted" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded border border-border-hairline bg-cream px-2 py-1.5 text-sm text-ink"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-muted" htmlFor="postcode">
            Postcode
          </label>
          <input
            id="postcode"
            name="postcode"
            defaultValue={params.postcode ?? ""}
            placeholder="e.g. EH2"
            className="rounded border border-border-hairline bg-cream px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-navy-900 px-4 py-1.5 text-sm font-medium text-cream hover:bg-navy-800"
        >
          Filter
        </button>
        {(params.status || params.postcode) && (
          <Link href="/" className="text-sm text-ink-muted underline underline-offset-2">
            Clear
          </Link>
        )}
      </form>

      {properties.length === 0 ? (
        <p className="mt-16 text-center text-sm text-ink-muted">
          No properties match those filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <Link
              key={property.ref}
              href={`/properties/${property.ref}`}
              className="group overflow-hidden rounded-lg border border-border-hairline bg-paper transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-cream-dim">
                {property.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external demo storage, not worth a remotePatterns entry
                  <img
                    src={property.photos[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-ink-faint">
                    No photo
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Pill tone={propertyStatusTone(property.status)} label={titleCase(property.status)} />
                </div>
              </div>
              <div className="p-3">
                <p className="truncate font-heading text-base font-semibold text-navy-950">
                  {property.address_line1}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {property.postcode}
                  {property.city ? ` · ${property.city}` : ""}
                </p>
                <p className="mt-2 text-sm font-medium text-amber-600">{formatPrice(property)}</p>
                <p className="text-xs text-ink-muted">
                  {property.bedrooms != null ? `${property.bedrooms} bed` : "—"} ·{" "}
                  {titleCase(property.property_type)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {next_cursor && (
        <div className="mt-8 flex justify-center">
          <Link
            href={{ pathname: "/", query: nextQuery }}
            className="rounded border border-border-hairline bg-paper px-4 py-2 text-sm font-medium text-navy-900 hover:bg-cream-dim"
          >
            Next page →
          </Link>
        </div>
      )}
    </div>
  );
}
