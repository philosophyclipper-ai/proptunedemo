import Link from "next/link";
import { getAllProperties, getViewings } from "@/lib/ui/api-client";
import { resolveContacts } from "@/lib/ui/resolve-contacts";
import { addDays, isSameDay, startOfWeek, toDateParam } from "@/lib/ui/dates";
import { formatDate, formatTime, titleCase } from "@/lib/ui/format";
import { Pill } from "@/components/pill";
import { viewingStatusTone } from "@/lib/ui/status-tone";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Shared by Sales' and Lettings' Viewings pages — same week-grid mechanics,
// filtered to whichever section's properties.
export async function ViewingsWeekView({
  listingType,
  basePath,
  week,
}: {
  listingType: "sales" | "lettings";
  basePath: string;
  week?: string;
}) {
  const anchor = week ? new Date(week) : new Date();
  const monday = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekEnd = addDays(days[6], 1); // exclusive

  const [{ viewings: allViewings }, properties] = await Promise.all([
    getViewings(),
    getAllProperties(),
  ]);

  const propertyByRef = new Map(properties.map((p) => [p.ref, p]));
  const viewings = allViewings.filter(
    (v) => v.property_ref && propertyByRef.get(v.property_ref)?.listing_type === listingType
  );

  const contacts = await resolveContacts(viewings.map((v) => v.contact_id));

  const weekViewings = viewings.filter(
    (v) => v.scheduled_at && new Date(v.scheduled_at) >= monday && new Date(v.scheduled_at) < weekEnd
  );
  const awaitingViewings = viewings.filter((v) => v.status === "requested");

  const prevWeek = toDateParam(addDays(monday, -7));
  const nextWeek = toDateParam(addDays(monday, 7));
  const today = new Date();

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">Viewings</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={{ pathname: basePath, query: { week: prevWeek } }}
            className="rounded border border-border-hairline bg-paper px-3 py-1.5 hover:bg-cream-dim"
          >
            ← Previous
          </Link>
          <span className="px-1 text-ink-muted">
            {formatDate(days[0].toISOString())} – {formatDate(days[6].toISOString())}
          </span>
          <Link
            href={{ pathname: basePath, query: { week: nextWeek } }}
            className="rounded border border-border-hairline bg-paper px-3 py-1.5 hover:bg-cream-dim"
          >
            Next →
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, i) => {
          const dayViewings = weekViewings.filter((v) => isSameDay(new Date(v.scheduled_at!), day));
          const isToday = isSameDay(day, today);

          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                isToday ? "border-amber-500 bg-amber-tint" : "border-border-hairline bg-paper"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700">
                {DAY_LABELS[i]} <span className="text-ink-faint">{day.getDate()}</span>
              </p>

              {dayViewings.length === 0 && <p className="text-xs text-ink-faint">—</p>}

              <ul className="flex flex-col gap-2">
                {dayViewings.map((v) => (
                  <li key={v.id} className="rounded border border-border-hairline bg-cream p-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-ink">{formatTime(v.scheduled_at!)}</span>
                      <Pill tone={viewingStatusTone(v.status)} label={titleCase(v.status)} />
                    </div>
                    <p className="mt-1 text-ink-muted">
                      {v.property_ref && (
                        <Link href={`/properties/${v.property_ref}`} className="hover:underline">
                          {propertyByRef.get(v.property_ref)?.address_line1 ?? v.property_ref}
                        </Link>
                      )}
                      <br />
                      {contacts.get(v.contact_id)?.name ?? "Unknown contact"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {awaitingViewings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-lg font-semibold text-navy-950">
            Awaiting Vendor Confirmation
          </h2>
          <ul className="flex flex-col gap-2">
            {awaitingViewings.map((v) => (
              <li
                key={v.id}
                className="rounded-lg border border-border-hairline bg-paper p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-navy-950">
                    {v.property_ref && (
                      <Link href={`/properties/${v.property_ref}`} className="hover:underline">
                        {propertyByRef.get(v.property_ref)?.address_line1 ?? v.property_ref}
                      </Link>
                    )}{" "}
                    — {contacts.get(v.contact_id)?.name ?? "Unknown contact"}
                  </span>
                  <Pill tone="amber" label="Requested" />
                </div>
                {v.proposed_times && v.proposed_times.length > 0 && (
                  <p className="mt-1 text-ink-muted">
                    Proposed: {v.proposed_times.map((t) => formatDate(t)).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
