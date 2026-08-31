import { describe, expect, it } from "vitest";
import { normalizePhone, phonesMatch, toE164Phone } from "@/lib/api/phone";

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

describe("toE164Phone", () => {
  it("normalises any reasonable UK shape to +44", () => {
    expect(toE164Phone("+447700900202")).toEqual({ value: "+447700900202" });
    expect(toE164Phone("07700900202")).toEqual({ value: "+447700900202" });
    expect(toE164Phone("07700 900202")).toEqual({ value: "+447700900202" });
  });

  it("accepts an already-valid non-UK E.164 number as-is", () => {
    expect(toE164Phone("+14155551234")).toEqual({ value: "+14155551234" });
  });

  it("rejects a surname typed into the phone field", () => {
    expect(toE164Phone("White")).toHaveProperty("error");
  });

  it("rejects an incomplete/short number", () => {
    expect(toE164Phone("08001111")).toHaveProperty("error");
  });

  it("rejects empty input", () => {
    expect(toE164Phone("")).toHaveProperty("error");
    expect(toE164Phone("   ")).toHaveProperty("error");
  });
});
