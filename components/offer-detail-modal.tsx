"use client";

import Link from "next/link";
import { Modal } from "@/components/modal";
import { QuickEditContactForm } from "@/components/forms/quick-edit-contact-form";
import { EditOfferFieldsForm } from "@/components/forms/edit-offer-fields-form";
import { AddOfferContactForm } from "@/components/forms/add-offer-contact-form";
import { AddNoteForm } from "@/components/forms/add-note-form";
import { NotesList } from "@/components/notes-list";
import type { Contact, Note, Offer } from "@/lib/ui/types";
import type { ReactNode } from "react";

const DEFAULT_CLASS =
  "cursor-pointer rounded border border-border-hairline bg-cream p-3 hover:border-amber-500";

export function OfferDetailModal({
  offer,
  contact,
  listingType,
  notes,
  revalidatePaths,
  className,
  children,
}: {
  offer: Offer;
  contact?: Contact;
  listingType: "sales" | "lettings";
  notes: Note[];
  revalidatePaths: string[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title={listingType === "lettings" ? "Application" : "Offer"}
      trigger={(open) => (
        <li onClick={open} className={className ?? DEFAULT_CLASS}>
          {children}
        </li>
      )}
    >
      {() => (
        <div className="flex flex-col gap-5">
          {contact && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Primary Contact
              </p>
              <QuickEditContactForm contact={contact} revalidatePaths={revalidatePaths} />
            </section>
          )}

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Additional Contacts
            </p>
            {offer.additional_contacts.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {offer.additional_contacts.map((c) => (
                  <li key={c.id} className="text-sm text-ink">
                    <Link href={`/contacts/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>{" "}
                    <span className="text-ink-muted">· {c.phone_primary}</span>
                  </li>
                ))}
              </ul>
            )}
            <AddOfferContactForm
              offerId={offer.id}
              listingType={listingType}
              revalidatePaths={revalidatePaths}
            />
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {listingType === "lettings" ? "Application" : "Offer"}
            </p>
            <EditOfferFieldsForm offer={offer} revalidatePaths={revalidatePaths} />
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Notes
            </p>
            <NotesList notes={notes} />
            <div className="mt-2">
              <AddNoteForm entityType="offer" entityId={offer.id} revalidatePaths={revalidatePaths} />
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
