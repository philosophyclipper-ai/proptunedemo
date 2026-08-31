import { DateTime } from "luxon";

const LONDON = "Europe/London";

// The one place a wall-clock time entered by staff (the "Scheduled Time" /
// "Proposed Time" inputs — plain datetime-local strings with no offset of
// their own) gets turned into a UTC instant. `new Date(str).toISOString()`
// used to do this, which silently used the server runtime's own default
// timezone instead of Europe/London — correct by accident in local dev
// (this machine happens to be London-zoned) but wrong by an hour
// throughout BST on Vercel, whose serverless functions default to UTC.
export function londonWallTimeToUtcIso(localDateTimeValue: string): string {
  const dt = DateTime.fromISO(localDateTimeValue, { zone: LONDON });
  if (!dt.isValid) throw new Error(`Invalid date/time: ${localDateTimeValue}`);
  return dt.toUTC().toISO()!;
}

// The inverse, for pre-filling a datetime-local input when editing an
// existing UTC-stored time. Explicit about the zone rather than reading it
// back with plain Date getters, which use the browser's own local zone —
// usually correct for UK-based staff, but not guaranteed.
export function utcIsoToLondonWallTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  return DateTime.fromISO(iso, { zone: "utc" }).setZone(LONDON).toFormat("yyyy-LL-dd'T'HH:mm");
}
