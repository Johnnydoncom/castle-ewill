import { describe, expect, it } from "vitest";

import { toInternational } from "@/lib/sms/termii";

/**
 * Termii wants an international number with no leading `+`. Nigerian numbers
 * are usually entered as `0803…`, so the leading zero must be replaced by the
 * country code rather than kept — `2340803…` would not deliver.
 */
describe("phone normalisation", () => {
  it.each([
    ["08111115547", "2348111115547"],
    ["0803 123 4567", "2348031234567"],
    ["+2348111115547", "2348111115547"],
    ["234 811 111 5547", "2348111115547"],
    ["8111115547", "2348111115547"],
    ["(0811) 111-5547", "2348111115547"],
  ])("normalises %s to %s", (input, expected) => {
    expect(toInternational(input)).toBe(expected);
  });

  it("does not double the country code", () => {
    expect(toInternational("2348111115547")).toBe("2348111115547");
    expect(toInternational(toInternational("08111115547"))).toBe(
      "2348111115547",
    );
  });

  it("strips punctuation and spacing", () => {
    expect(toInternational("+234-811-111-5547")).toBe("2348111115547");
  });
});
