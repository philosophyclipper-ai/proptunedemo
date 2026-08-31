// Single source of truth for UK phone matching — used by both
// GET /contacts?phone= and GET /contacts/resolve. Real seeded numbers are
// genuinely inconsistent (+447700900202, 07700900202, 07700 900202 all
// refer to the same contact today; some rows are landline-length or
// outright garbage), so exact string equality silently under-matches.
//
// Rules, in order:
//   1. Strip everything that isn't a digit.
//   2. If it starts '44' and is 12 digits, drop the '44' (E.164 -> national).
//   3. If it starts '0', drop the leading '0' (national -> bare number).
// Whatever's left is the normalised form.

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("44") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

// Two normalised values are compared as a last-10-digit suffix (absorbs
// stray leading digits from odd input) — except:
//   - either side shorter than 7 digits compares literally, never by
//     suffix, so a short landline snippet (e.g. '08001111' -> '8001111')
//     can't accidentally match inside a longer number.
//   - either side empty never matches anything, so garbage data (a name
//     typed into the phone field normalises to '') can't match every
//     other garbage row.
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na === "" || nb === "") return false;
  if (na.length < 7 || nb.length < 7) return na === nb;
  return na.slice(-10) === nb.slice(-10);
}

// Validates and normalises a phone number on entry, reusing the same
// normalizePhone rules as lookup so a number that gets accepted here is
// guaranteed to be findable later. Used client- and server-side — pure
// function, no framework dependency, safe in either bundle.
//
// A UK number in any reasonable shape (+447700900202, 07700900202,
// "07700 900202") normalises to exactly 10 digits and is stored as
// +44<10 digits>. Anything already in valid E.164 form for another
// country is accepted as-is — there are no real non-UK numbers in this
// CRM's data today, so there's nothing to reconcile a "flag for review"
// state against; if that changes, this is the one place to add it.
// Anything else (empty, too short, non-numeric — the exact shape of the
// "White" bug) is rejected outright.
export function toE164Phone(raw: string): { value: string } | { error: string } {
  const trimmed = raw.trim();
  const ERROR = "Enter a valid UK phone number (e.g. 07700 900202) or a full international number starting with +";

  if (!trimmed) return { error: ERROR };

  if (trimmed.startsWith("+") && !trimmed.startsWith("+44")) {
    return /^\+[1-9]\d{7,14}$/.test(trimmed) ? { value: trimmed } : { error: ERROR };
  }

  const normalized = normalizePhone(trimmed);
  if (normalized.length === 10 && /^[1-9]/.test(normalized)) {
    return { value: `+44${normalized}` };
  }
  return { error: ERROR };
}
