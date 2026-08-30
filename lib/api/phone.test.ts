import { describe, expect, it } from "vitest";
import { normalizePhone, phonesMatch } from "@/lib/api/phone";

describe("phonesMatch", () => {
  it("matches the three equivalent forms of the same UK mobile number", () => {
    expect(phonesMatch("+447700900202", "07700900202")).toBe(true);
    expect(phonesMatch("+447700900202", "07700 900202")).toBe(true);
    expect(phonesMatch("07700900202", "07700 900202")).toBe(true);
  });

  it("does not let a short landline snippet suffix-match a mobile", () => {
    expect(normalizePhone("08001111")).toBe("8001111");
    expect(phonesMatch("08001111", "+447700900202")).toBe(false);
    expect(phonesMatch("08001111", "08001111")).toBe(true);
  });

  it("never matches garbage input that normalises to empty", () => {
    expect(normalizePhone("White")).toBe("");
    expect(phonesMatch("White", "White")).toBe(false);
    expect(phonesMatch("White", "+447700900202")).toBe(false);
  });
});
