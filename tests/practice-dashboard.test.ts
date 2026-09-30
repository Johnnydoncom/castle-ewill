import { describe, expect, it } from "vitest";

import type { ApiWill, WillJourney } from "@/lib/actions/will";
import {
  completionOf,
  needingAttention,
  practiceActionFor,
  openForUpdate,
  summarisePractice,
  testatorOf,
} from "@/lib/dashboard/practice";

/**
 * A lawyer's dashboard reads their practice off the server's journey for each
 * client Will. These hold the wording and the counting to it.
 */

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
    journey: journey({
      stage: "execute",
      print_blocked_by: null,
      can_print: true,
      printed_at: "2026-09-01T00:00:00Z",
    }),
  }),
  aWill({
    id: "opened",
    status: "submitted",
    printed_at: "2026-09-01T00:00:00Z",
    journey: journey({
      stage: "execute",
      print_blocked_by: null,
      can_print: true,
      amendment_permitted: true,
      can_update: true,
      printed_at: "2026-09-01T00:00:00Z",
    }),
  }),
  aWill({ id: "archived", status: "archived" }),
];

describe("a lawyer's practice dashboard", () => {
  it("counts the practice by where each Will stands, leaving archived Wills out", () => {
    expect(summarisePractice(practice)).toEqual({
      total: 5,
      drafting: 1,
      awaitingPayment: 1,
      readyToPrint: 1,
      issued: 2,
      openForUpdate: 1,
    });
  });

  it("raises what is waiting on the lawyer, in the order the API lists it", () => {
    expect(needingAttention(practice).map(({ will }) => will.id)).toEqual([
      "unpaid",
      "ready",
      "opened",
    ]);
  });

  it("continues a draft at its next unanswered step", () => {
    const draft = aWill({ id: "a", progress: { next_incomplete_step: 3, percent: 40 } });

    expect(practiceActionFor(draft)).toMatchObject({
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

    expect(practiceActionFor(will).href).toBe("/dashboard/kyc");
  });

  it("raises a Will Castle has opened for an update, and never a renewal", () => {
    const opened = aWill({
      status: "submitted",
      journey: journey({ print_blocked_by: null, amendment_permitted: true }),
    });

    expect(openForUpdate(opened)).toBe(true);
    expect(practiceActionFor(opened)).toMatchObject({ label: "Opened for update", cta: "Update" });
    // Once reopened into a draft it is being edited, not waiting.
    expect(openForUpdate(aWill({ journey: journey({ amendment_permitted: true }) }))).toBe(false);
    // A lawyer's Will has no subscription to renew, whatever an old expiry says.
    expect(
      practiceActionFor(
        aWill({
          status: "submitted",
          has_active_subscription: true,
          subscription_expires_at: "2026-10-01T00:00:00Z",
          journey: journey({ print_blocked_by: null, printed_at: "2026-09-01T00:00:00Z" }),
        }),
      ).label,
    ).toBe("Issued");
  });

  it("names the client, or nobody before they are named", () => {
    expect(testatorOf(aWill({ personal: { full_legal_name: "Julius Ade" } }))).toBe("Julius Ade");
    expect(testatorOf(aWill({ personal: { full_legal_name: "  " } }))).toBeNull();
  });
});
