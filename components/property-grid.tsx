import Link from "next/link";
import type { Property } from "@/lib/ui/types";
import { formatPrice, formatRent, titleCase } from "@/lib/ui/format";
import { propertyStatusTone } from "@/lib/ui/status-tone";
import { Pill } from "@/components/pill";

export function PropertyGrid({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <p className="mt-16 text-center text-sm text-ink-muted">
        No properties match those filters.
      </p>
    );
  }

  return (
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
              <img src={property.photos[0]} alt="" className="h-full w-full object-cover" />
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
            <p className="mt-2 text-sm font-medium text-amber-600">
              {property.listing_type === "lettings" ? formatRent(property) : formatPrice(property)}
            </p>
            <p className="text-xs text-ink-muted">
              {property.bedrooms === 0
                ? "Studio"
                : property.bedrooms != null
                  ? `${property.bedrooms} bed`
                  : "—"}{" "}
              · {titleCase(property.property_type)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
