import { describe, expect, it } from "vitest";

import { describeStanding, readableDate, subscriptionStanding } from "@/lib/will/subscription";

/**
 * How a Will's subscription reads on its page and on the billing page.
 *
 * Whether it is active is the server's answer; these only word it.
 */
describe("a Will's subscription standing", () => {
  it("takes whether it is active from the server, not from the date", () => {
    expect(subscriptionStanding("2027-09-13T20:23:07+00:00", true)).toEqual({
      kind: "active",
      until: "2027-09-13T20:23:07+00:00",
    });
    // The server says it has ended: a date this browser thinks is ahead does not overrule it.
    expect(subscriptionStanding("2027-09-13T20:23:07+00:00", false)).toEqual({
      kind: "ended",
      on: "2027-09-13T20:23:07+00:00",
    });
    expect(subscriptionStanding(null, false)).toEqual({ kind: "none" });
  });

  it("says it in one line, dated in Lagos", () => {
    expect(describeStanding({ kind: "active", until: "2027-09-13T20:23:07+00:00" })).toBe(
      "Active until 13 September 2027",
    );
    // 23:30 UTC on the 13th is already the 14th in Lagos.
    expect(readableDate("2027-09-13T23:30:00+00:00")).toBe("14 September 2027");
    expect(describeStanding({ kind: "none" })).toBe("No subscription yet");
  });
});
