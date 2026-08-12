import Link from "next/link";
import { getAllProperties, getOffers } from "@/lib/ui/api-client";
import { resolveContacts } from "@/lib/ui/resolve-contacts";
import { resolveNotesByEntity } from "@/lib/ui/resolve-notes";
import { formatDateTime, formatMoney, titleCase } from "@/lib/ui/format";
import { offerStatusTone } from "@/lib/ui/status-tone";
import { Pill } from "@/components/pill";
import { OfferDetailModal } from "@/components/offer-detail-modal";
import type { Offer } from "@/lib/ui/types";

// Shared by Sales' Offers board and Lettings' Applications board — same
// underlying offers/notes-of-interest table, just relabeled per section.
export async function OffersBoard({
  listingType,
  basePath,
  heading,
  noteLabel,
  firmLabel,
  emptyLabel,
}: {
  listingType: "sales" | "lettings";
  basePath: string;
  heading: string;
  noteLabel: string;
  firmLabel: string;
  emptyLabel: string;
}) {
  const [{ offers: allOffers }, properties] = await Promise.all([getOffers(), getAllProperties()]);

  const propertyByRef = new Map(properties.map((p) => [p.ref, p]));
  const offers = allOffers.filter(
    (o) => o.property_ref && propertyByRef.get(o.property_ref)?.listing_type === listingType
  );

  const [contacts, notes] = await Promise.all([
    resolveContacts([
      ...offers.map((o) => o.contact_id),
      ...offers.map((o) => o.solicitor_contact_id),
      ...offers.flatMap((o) => o.additional_contacts.map((c) => c.id)),
    ]),
    resolveNotesByEntity(
      "offer",
      offers.map((o) => o.id)
    ),
  ]);

  const groups = new Map<string, Offer[]>();
  for (const offer of offers) {
    const key = offer.property_ref as string;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(offer);
  }

  const sortedRefs = [...groups.keys()].sort((a, b) => {
    const latestA = Math.max(...groups.get(a)!.map((o) => new Date(o.created_at).getTime()));
    const latestB = Math.max(...groups.get(b)!.map((o) => new Date(o.created_at).getTime()));
    return latestB - latestA;
  });

  const revalidatePaths = [basePath];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">{heading}</h1>
        <p className="text-sm text-ink-muted">
          {offers.length} across {groups.size} properties
        </p>
      </header>

      {sortedRefs.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedRefs.map((ref) => {
            const property = propertyByRef.get(ref);
            const groupOffers = groups.get(ref)!;
            return (
              <section key={ref} className="rounded-lg border border-border-hairline bg-paper p-5">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <Link
                    href={`/properties/${ref}`}
                    className="font-heading text-lg font-semibold text-navy-950 hover:underline"
                  >
                    {property?.address_line1 ?? ref}
                  </Link>
                  <span className="text-xs text-ink-muted">{ref}</span>
                </div>

                <ul className="flex flex-col gap-2">
                  {groupOffers.map((offer) => (
                    <OfferDetailModal
                      key={offer.id}
                      offer={offer}
                      contact={contacts.get(offer.contact_id)}
                      listingType={listingType}
                      notes={notes.get(offer.id) ?? []}
                      revalidatePaths={revalidatePaths}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded border border-border-hairline bg-cream px-3 py-2 text-sm hover:border-amber-500"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/contacts/${offer.contact_id}`}
                          className="font-medium text-navy-950 hover:underline"
                        >
                          {contacts.get(offer.contact_id)?.name ?? "Unknown contact"}
                        </Link>
                        {offer.additional_contacts.length > 0 && (
                          <span className="text-xs text-ink-muted">
                            {" "}
                            + {offer.additional_contacts.map((c) => c.name).join(", ")}
                          </span>
                        )}
                        <p className="text-xs text-ink-muted">
                          {formatDateTime(offer.created_at)}
                          {offer.received_via ? ` · ${titleCase(offer.received_via)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {offer.amount != null && (
                          <span className="font-medium text-amber-600">
                            {formatMoney(offer.amount)}
                          </span>
                        )}
                        <span className="text-xs uppercase tracking-wide text-ink-faint">
                          {offer.type === "offer" ? firmLabel : noteLabel}
                        </span>
                        <Pill tone={offerStatusTone(offer.status)} label={titleCase(offer.status)} />
                      </div>
                    </OfferDetailModal>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
