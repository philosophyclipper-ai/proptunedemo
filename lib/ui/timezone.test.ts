import { describe, expect, it } from "vitest";
import { londonWallTimeToUtcIso, utcIsoToLondonWallTimeInputValue } from "@/lib/ui/timezone";

describe("londonWallTimeToUtcIso / utcIsoToLondonWallTimeInputValue", () => {
  it("stores 27 August 8pm (BST) an hour ahead of UTC", () => {
    const utc = londonWallTimeToUtcIso("2026-08-27T20:00");
    expect(utc).toBe("2026-08-27T19:00:00.000Z");
  });

  it("stores 27 January 8pm (GMT) with no offset from UTC", () => {
    const utc = londonWallTimeToUtcIso("2026-01-27T20:00");
    expect(utc).toBe("2026-01-27T20:00:00.000Z");
  });

  it("both read back as 8:00pm in London, even though their stored UTC values differ by an hour", () => {
    const augustUtc = londonWallTimeToUtcIso("2026-08-27T20:00");
    const januaryUtc = londonWallTimeToUtcIso("2026-01-27T20:00");

    expect(utcIsoToLondonWallTimeInputValue(augustUtc)).toBe("2026-08-27T20:00");
    expect(utcIsoToLondonWallTimeInputValue(januaryUtc)).toBe("2026-01-27T20:00");

    const augustHourUtc = new Date(augustUtc).getUTCHours();
    const januaryHourUtc = new Date(januaryUtc).getUTCHours();
    expect(januaryHourUtc - augustHourUtc).toBe(1);
  });
});
