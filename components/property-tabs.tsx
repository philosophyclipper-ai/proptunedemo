"use client";

import { useState } from "react";
import Link from "next/link";
import type { Contact, Note, Offer, Viewing } from "@/lib/ui/types";
import { Pill } from "@/components/pill";
import { offerStatusTone, viewingStatusTone } from "@/lib/ui/status-tone";
import { formatDateTime, formatMoney, titleCase } from "@/lib/ui/format";

type Props = {
  viewings: Viewing[];
  offers: Offer[];
  notes: Note[];
  contacts: Record<string, Contact>;
};

const TABS = ["Viewings", "Offers & Notes of Interest", "Notes"] as const;
type Tab = (typeof TABS)[number];

export function PropertyTabs({ viewings, offers, notes, contacts }: Props) {
  const [active, setActive] = useState<Tab>("Viewings");
  const counts: Record<Tab, number> = {
    Viewings: viewings.length,
    "Offers & Notes of Interest": offers.length,
    Notes: notes.length,
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border-hairline">
        {TABS.map((tab) => (
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
        {active === "Viewings" && <ViewingsTab viewings={viewings} contacts={contacts} />}
        {active === "Offers & Notes of Interest" && (
          <OffersTab offers={offers} contacts={contacts} />
        )}
        {active === "Notes" && <NotesTab notes={notes} />}
      </div>
    </div>
  );
}

function ViewingsTab({ viewings, contacts }: { viewings: Viewing[]; contacts: Record<string, Contact> }) {
  if (viewings.length === 0) return <EmptyState label="No viewings yet." />;
  return (
    <ul className="flex flex-col gap-2">
      {viewings.map((v) => (
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
        </li>
      ))}
    </ul>
  );
}

function OffersTab({ offers, contacts }: { offers: Offer[]; contacts: Record<string, Contact> }) {
  if (offers.length === 0) return <EmptyState label="No offers or notes of interest yet." />;
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
                {o.type === "offer" ? "Offer" : "Note of Interest"}
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
