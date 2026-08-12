import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContact,
  getOffers,
  getProperty,
  getPropertyNotes,
  getViewingArrangement,
  getViewings,
} from "@/lib/ui/api-client";
import { resolveContacts } from "@/lib/ui/resolve-contacts";
import { resolveNotesByEntity } from "@/lib/ui/resolve-notes";
import {
  formatAddress,
  formatDate,
  formatMoney,
  formatPrice,
  formatRent,
  titleCase,
} from "@/lib/ui/format";
import { propertyStatusTone } from "@/lib/ui/status-tone";
import { Pill } from "@/components/pill";
import { PropertyTabs } from "@/components/property-tabs";
import { EditListingButton } from "@/components/edit-listing-button";
import { AddMaintenanceButton } from "@/components/add-maintenance-button";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  const property = await getProperty(ref).catch(() => null);
  if (!property) notFound();

  const [viewingArrangement, notesResult, viewingsResult, offersResult, vendorContact] =
    await Promise.all([
      getViewingArrangement(ref),
      getPropertyNotes(ref),
      getViewings({ property_ref: ref }),
      getOffers({ property_ref: ref }),
      property.vendor_contact_id
        ? getContact(property.vendor_contact_id).catch(() => null)
        : Promise.resolve(null),
    ]);

  const [contactsMap, feedbackMap, offerNotesMap] = await Promise.all([
    resolveContacts([
      ...viewingsResult.viewings.map((v) => v.contact_id),
      ...offersResult.offers.map((o) => o.contact_id),
      ...offersResult.offers.map((o) => o.solicitor_contact_id),
      ...offersResult.offers.flatMap((o) => o.additional_contacts.map((c) => c.id)),
    ]),
    resolveNotesByEntity(
      "viewing",
      viewingsResult.viewings.map((v) => v.id)
    ),
    resolveNotesByEntity(
      "offer",
      offersResult.offers.map((o) => o.id)
    ),
  ]);
  const contacts = Object.fromEntries(contactsMap);
  const feedback = Object.fromEntries(feedbackMap);
  const offerNotes = Object.fromEntries(offerNotesMap);
  const isLettings = property.listing_type === "lettings";

  return (
    <div className="p-8">
      <Link
        href={isLettings ? "/lettings" : "/sales"}
        className="text-sm text-ink-muted hover:text-navy-900"
      >
        ← Back to {isLettings ? "Lettings" : "Sales"} Listings
      </Link>

      <header className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-navy-950">
            {property.address_line1}
          </h1>
          <p className="text-sm text-ink-muted">
            {formatAddress(property)} · {property.ref}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Pill tone={propertyStatusTone(property.status)} label={titleCase(property.status)} />
          {isLettings && <AddMaintenanceButton propertyRef={property.ref} />}
          <EditListingButton
            property={property}
            vendorName={vendorContact?.name}
            vendorPhone={vendorContact?.phone_primary}
            viewingNotes={viewingArrangement.viewing_notes}
          />
        </div>
      </header>

      {property.photos.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {property.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- external demo storage, not worth a remotePatterns entry
            <img
              key={url}
              src={url}
              alt=""
              className="h-56 w-80 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-border-hairline bg-paper p-5">
            {isLettings ? (
              <p className="font-heading text-2xl font-semibold text-amber-600">
                {formatRent(property)}
              </p>
            ) : (
              <>
                <p className="font-heading text-2xl font-semibold text-amber-600">
                  {formatPrice(property)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Home Report Value: {formatMoney(property.home_report_value)}
                </p>
                {property.home_report_url && (
                  <a
                    href={property.home_report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-navy-700 underline underline-offset-2"
                  >
                    View Home Report
                  </a>
                )}
              </>
            )}
          </section>

          <section className="rounded-lg border border-border-hairline bg-paper p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">Attributes</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Attribute
                label="Bedrooms"
                value={
                  property.bedrooms === 0
                    ? "Studio"
                    : property.bedrooms != null
                      ? String(property.bedrooms)
                      : "—"
                }
              />
              <Attribute label="Type" value={titleCase(property.property_type)} />
              {!isLettings && <Attribute label="Tenure" value={titleCase(property.tenure)} />}
              <Attribute label="Council Tax Band" value={property.council_tax_band ?? "—"} />
              <Attribute label="EPC Rating" value={property.epc_rating ?? "—"} />
              {!isLettings && (
                <Attribute label="Closing Date" value={formatDate(property.closing_date)} />
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-border-hairline bg-paper p-5">
            <PropertyTabs
              propertyRef={property.ref}
              listingType={property.listing_type}
              vendorLed={viewingArrangement.conducted_by === "vendor"}
              viewings={viewingsResult.viewings}
              offers={offersResult.offers}
              notes={notesResult.notes}
              contacts={contacts}
              feedback={feedback}
              offerNotes={offerNotes}
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border-hairline bg-paper p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">
              Vendor / Landlord
            </h2>
            {vendorContact ? (
              <Link href={`/contacts/${vendorContact.id}`} className="block hover:underline">
                <p className="font-medium text-navy-950">{vendorContact.name}</p>
                <p className="text-sm text-ink-muted">{vendorContact.phone_primary}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">
                  {vendorContact.roles.join(", ")}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-ink-muted">No vendor on file.</p>
            )}
          </section>

          <section className="rounded-lg border border-border-hairline bg-paper p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">
              Viewing Arrangement
            </h2>
            <p className="text-sm text-ink-muted">
              Conducted by{" "}
              <span className="font-medium text-ink">
                {titleCase(viewingArrangement.conducted_by)}
              </span>
            </p>
            {viewingArrangement.viewing_notes && (
              <p className="mt-3 whitespace-pre-wrap rounded border border-border-hairline bg-cream p-3 text-sm text-ink">
                {viewingArrangement.viewing_notes}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
