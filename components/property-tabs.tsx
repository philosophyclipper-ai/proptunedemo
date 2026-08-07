"use client";

import { useState } from "react";
import Link from "next/link";
import type { Contact, Note, Offer, Viewing } from "@/lib/ui/types";
import { Pill } from "@/components/pill";
import { offerStatusTone, viewingStatusTone } from "@/lib/ui/status-tone";
import { formatDateTime, formatMoney, titleCase } from "@/lib/ui/format";

type Props = {
  listingType: "sales" | "lettings";
  viewings: Viewing[];
  offers: Offer[];
  notes: Note[];
  contacts: Record<string, Contact>;
  feedback: Record<string, Note[]>;
};

export function PropertyTabs({ listingType, viewings, offers, notes, contacts, feedback }: Props) {
  const offersTabLabel = listingType === "lettings" ? "Applications" : "Offers & Notes of Interest";
  const noteLabel = listingType === "lettings" ? "Enquiry" : "Note of Interest";
  const firmLabel = listingType === "lettings" ? "Application" : "Offer";

  const tabs = ["Viewings", offersTabLabel, "Notes"] as const;
  type Tab = (typeof tabs)[number];
  const [active, setActive] = useState<Tab>("Viewings");

  const counts: Record<string, number> = {
    Viewings: viewings.length,
    [offersTabLabel]: offers.length,
    Notes: notes.length,
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border-hairline">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-amber-500 text-navy-950"
                : "border-transparent text-ink-muted hover:text-navy-900"
            }`}
          >
            {tab}
            {counts[tab] > 0 && <span className="ml-1 text-ink-faint">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      <div className="py-4">
        {active === "Viewings" && (
          <ViewingsTab viewings={viewings} contacts={contacts} feedback={feedback} />
        )}
        {active === offersTabLabel && (
          <OffersTab offers={offers} contacts={contacts} noteLabel={noteLabel} firmLabel={firmLabel} />
        )}
        {active === "Notes" && <NotesTab notes={notes} />}
      </div>
    </div>
  );
}

function ViewingsTab({
  viewings,
  contacts,
  feedback,
}: {
  viewings: Viewing[];
  contacts: Record<string, Contact>;
  feedback: Record<string, Note[]>;
}) {
  if (viewings.length === 0) return <EmptyState label="No viewings yet." />;
  return (
    <ul className="flex flex-col gap-2">
      {viewings.map((v) => {
        const viewingFeedback = feedback[v.id] ?? [];
        return (
          <li key={v.id} className="rounded border border-border-hairline bg-cream p-3">
            <div className="flex items-center justify-between">
              <Link href={`/contacts/${v.contact_id}`} className="font-medium text-navy-950 hover:underline">
                {contacts[v.contact_id]?.name ?? "Unknown contact"}
              </Link>
              <Pill tone={viewingStatusTone(v.status)} label={titleCase(v.status)} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {v.scheduled_at
                ? formatDateTime(v.scheduled_at)
                : v.proposed_times && v.proposed_times.length > 0
                  ? `Proposed: ${v.proposed_times.map((t) => formatDateTime(t)).join(", ")}`
                  : "No time set"}
            </p>
            {viewingFeedback.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 border-t border-border-hairline pt-2">
                {viewingFeedback.map((note) => (
                  <div key={note.id}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        Feedback
                      </span>
                      <Pill
                        tone={note.author_type === "ai" ? "amber" : "navy"}
                        label={note.author_type === "ai" ? "AI" : "Staff"}
                      />
                      <span className="text-xs text-ink-faint">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-ink">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function OffersTab({
  offers,
  contacts,
  noteLabel,
  firmLabel,
}: {
  offers: Offer[];
  contacts: Record<string, Contact>;
  noteLabel: string;
  firmLabel: string;
}) {
  if (offers.length === 0) return <EmptyState label="Nothing on record yet." />;
  return (
    <ul className="flex flex-col gap-2">
      {offers.map((o) => (
        <li key={o.id} className="rounded border border-border-hairline bg-cream p-3">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/contacts/${o.contact_id}`} className="font-medium text-navy-950 hover:underline">
              {contacts[o.contact_id]?.name ?? "Unknown contact"}
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-ink-faint">
                {o.type === "offer" ? firmLabel : noteLabel}
              </span>
              <Pill tone={offerStatusTone(o.status)} label={titleCase(o.status)} />
            </div>
          </div>
          {o.amount != null && (
            <p className="mt-1 text-sm font-medium text-amber-600">{formatMoney(o.amount)}</p>
          )}
          {o.solicitor_contact_id && contacts[o.solicitor_contact_id] && (
            <p className="mt-1 text-xs text-ink-muted">
              Solicitor: {contacts[o.solicitor_contact_id].name}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function NotesTab({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <EmptyState label="No notes yet." />;
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((n) => (
        <li key={n.id} className="rounded border border-border-hairline bg-cream p-3 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <Pill tone={n.author_type === "ai" ? "amber" : "navy"} label={n.author_type === "ai" ? "AI" : "Staff"} />
            <span className="text-xs text-ink-faint">{formatDateTime(n.created_at)}</span>
          </div>
          <p className="text-ink">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-ink-muted">{label}</p>;
}
