// Property refs (e.g. EH12345) are system-assigned, never typed by a
// negotiator or exposed as the internal uuid — outward postcode letters
// plus a random 5-digit number, same shape as the seeded data.
export function generatePropertyRef(postcode: string): string {
  const prefix = postcode.trim().toUpperCase().match(/^[A-Z]+/)?.[0] ?? "XX";
  const number = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${number}`;
}
