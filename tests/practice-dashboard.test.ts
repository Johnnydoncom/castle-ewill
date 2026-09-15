import { describe, expect, it } from "vitest";

import type { ApiWill, WillJourney } from "@/lib/actions/will";
import {
  completionOf,
  needingAttention,
  practiceActionFor,
  renewalDue,
  summarisePractice,
  testatorOf,
} from "@/lib/dashboard/practice";

/**
 * A lawyer's dashboard reads their practice off the server's journey for each
 * client Will. These hold the wording and the counting to it.
 */

const NOW = new Date("2026-09-15T12:00:00Z");

function journey(overrides: Partial<WillJourney> = {}): WillJourney {
  return {
    stage: "prepare",
    stages: [],
    is_paid: false,
    identity: { confirmed: true, requires: null, kyc_verified: true },
    is_subscribed: false,
    review_choice: "undecided",
    can_request_review: false,
    can_skip_review: false,
    can_print: false,
    print_blocked_by: "incomplete",
    update_blocked_by: null,
    can_update: false,
    printed_at: null,
    executed_at: null,
    lodged_at: null,
    ...overrides,
  };
}

function aWill(overrides: Record<string, unknown> = {}): ApiWill {
  return {
    id: "w",
    reference: "CW-2026-000000",
    title: "Last Will and Testament",
    status: "draft",
    current_step: 1,
    completion_percent: 0,
    printed_at: null,
    has_active_subscription: false,
    subscription_expires_at: null,
    personal: { full_legal_name: null },
    journey: journey(),
    ...overrides,
  } as unknown as ApiWill;
}

const practice = [
  aWill({ id: "drafting" }),
  aWill({
    id: "unpaid",
    status: "submitted",
    journey: journey({ stage: "legal_review", print_blocked_by: "unpaid" }),
  }),
  aWill({
    id: "ready",
    status: "submitted",
    journey: journey({ stage: "print", print_blocked_by: null, can_print: true }),
  }),
  aWill({
    id: "issued",
    status: "submitted",
    printed_at: "2026-09-01T00:00:00Z",
    has_active_subscription: true,
    subscription_expires_at: "2026-09-25T00:00:00Z",
    journey: journey({
      stage: "execute",
      print_blocked_by: null,
      can_print: true,
      printed_at: "2026-09-01T00:00:00Z",
    }),
  }),
  aWill({ id: "archived", status: "archived" }),
];

describe("a lawyer's practice dashboard", () => {
  it("counts the practice by where each Will stands, leaving archived Wills out", () => {
    expect(summarisePractice(practice, NOW)).toEqual({
      total: 4,
      drafting: 1,
      awaitingPayment: 1,
      readyToPrint: 1,
      issued: 1,
      renewalsDue: 1,
    });
  });

  it("raises what is waiting on the lawyer, in the order the API lists it", () => {
    expect(needingAttention(practice, NOW).map(({ will }) => will.id)).toEqual([
      "unpaid",
      "ready",
      "issued",
    ]);
  });

  it("continues a draft at its next unanswered step", () => {
    const draft = aWill({ id: "a", progress: { next_incomplete_step: 3, percent: 40 } });

    expect(practiceActionFor(draft, NOW)).toMatchObject({
      label: "Drafting",
      cta: "Continue drafting",
      href: "/dashboard/wills/a/edit?step=3",
    });
    expect(completionOf(draft)).toBe(40);
  });

  it("sends the lawyer's own identity check to the identity page, not the client's Will", () => {
    const will = aWill({
      status: "submitted",
      journey: journey({ stage: "legal_review", print_blocked_by: "kyc_required" }),
    });

    expect(practiceActionFor(will, NOW).href).toBe("/dashboard/kyc");
  });

  it("raises a renewal only inside the window", () => {
    const endingIn = (days: number) =>
      aWill({
        has_active_subscription: true,
        subscription_expires_at: new Date(NOW.getTime() + days * 86_400_000).toISOString(),
      });

    expect(renewalDue(endingIn(10), NOW)).toBe(true);
    expect(renewalDue(endingIn(60), NOW)).toBe(false);
    expect(renewalDue(endingIn(-1), NOW)).toBe(false);
  });

  it("names the client, or nobody before they are named", () => {
    expect(testatorOf(aWill({ personal: { full_legal_name: "Julius Ade" } }))).toBe("Julius Ade");
    expect(testatorOf(aWill({ personal: { full_legal_name: "  " } }))).toBeNull();
  });
});
