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
