import type { ApiWill, JourneyStage } from "@/lib/actions/will";

/**
 * A lawyer's practice, read off their client Wills (2026-09-15).
 *
 * Presentation only. Where each Will stands — its stage, what printing is
 * waiting on, whether it may be printed — is the server's journey and is never
 * worked out here. This sorts and words those answers for somebody running
 * many Wills at once rather than one.
 */

export type PracticeTone = "attention" | "ready" | "progress" | "done";

export type PracticeAction = {
  /** Where the Will stands, in a lawyer's words. */
  label: string;
  tone: PracticeTone;
  /** The button beside it. */
  cta: string;
  href: string;
};

export type PracticeSummary = {
  total: number;
  drafting: number;
  awaitingPayment: number;
  readyToPrint: number;
  issued: number;
  renewalsDue: number;
};

/** How far ahead a subscription ending counts as a renewal worth raising. */
export const RENEWAL_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Client Wills still on the books. An archived Will is not work. */
export function activeWills(wills: ApiWill[]): ApiWill[] {
  return wills.filter((will) => will.status !== "archived");
}

/** The client's name as it stands on the Will, or null before they are named. */
export function testatorOf(will: ApiWill): string | null {
  const name = will.personal?.full_legal_name?.trim();

  return name ? name : null;
}

/** Progress by the server's own rules where it sent them, else the stored figure. */
export function completionOf(will: ApiWill): number {
  return will.progress?.percent ?? will.completion_percent;
}

export function stageOf(will: ApiWill): JourneyStage | null {
  return will.journey?.stage ?? null;
}

/** Whether this Will's subscription runs out within the renewal window. */
export function renewalDue(will: ApiWill, now: Date = new Date()): boolean {
  if (!will.has_active_subscription || !will.subscription_expires_at) return false;

  const ends = new Date(will.subscription_expires_at).getTime();

  if (Number.isNaN(ends)) return false;

  return ends >= now.getTime() && ends - now.getTime() <= RENEWAL_WINDOW_DAYS * DAY_MS;
}

/**
 * What this Will is waiting on, and the one thing to press about it.
 *
 * Keyed on the server's `print_blocked_by`, in the order the server reports
 * it. `kyc_required` is the lawyer's own check — one covers every client Will —
 * so it goes to the identity page rather than to the client's Will.
 */
export function practiceActionFor(will: ApiWill, now: Date = new Date()): PracticeAction {
  const page = `/dashboard/wills/${will.id}`;
  const journey = will.journey;

  if (!journey) {
    return { label: "Open to see where it stands", tone: "progress", cta: "Open", href: page };
  }

  switch (journey.print_blocked_by) {
    case "incomplete":
      return will.status === "draft"
        ? {
            label: "Drafting",
            tone: "progress",
            cta: "Continue drafting",
            href: `${page}/edit?step=${will.progress?.next_incomplete_step ?? will.current_step ?? 1}`,
          }
        : { label: "Needs finishing", tone: "attention", cta: "Open", href: page };
    case "unpaid":
      return { label: "Awaiting payment", tone: "attention", cta: "Go to payment", href: page };
    case "kyc_required":
      return { label: "Your identity check", tone: "attention", cta: "Verify identity", href: "/dashboard/kyc" };
    case "passport_photograph_required":
      return { label: "Client's photograph needed", tone: "attention", cta: "Open", href: page };
    case "witnesses_required":
      return { label: "Witnesses being checked", tone: "progress", cta: "View", href: page };
    case "subscription_required":
      return { label: "Subscription ended", tone: "attention", cta: "Renew", href: `${page}#subscription` };
  }

  if (renewalDue(will, now)) {
    return { label: "Renewal due", tone: "attention", cta: "Renew", href: `${page}#subscription` };
  }

  if (journey.lodged_at) return { label: "Lodged", tone: "done", cta: "Manage", href: page };
  if (journey.executed_at) return { label: "Executed", tone: "done", cta: "Manage", href: page };
  if (journey.printed_at) return { label: "Issued", tone: "done", cta: "Manage", href: page };
  if (journey.can_print) return { label: "Ready to print", tone: "ready", cta: "Download", href: page };

  return { label: "In progress", tone: "progress", cta: "Open", href: page };
}

/** The practice in six numbers. */
export function summarisePractice(wills: ApiWill[], now: Date = new Date()): PracticeSummary {
  const active = activeWills(wills);

  return {
    total: active.length,
    drafting: active.filter((will) => will.journey?.stage === "prepare").length,
    awaitingPayment: active.filter((will) => will.journey?.print_blocked_by === "unpaid").length,
    readyToPrint: active.filter((will) => will.journey?.can_print && !will.journey.printed_at).length,
    issued: active.filter((will) => Boolean(will.journey?.printed_at ?? will.printed_at)).length,
    renewalsDue: active.filter((will) => renewalDue(will, now)).length,
  };
}

/**
 * The Wills waiting on the lawyer, or ready for them, in the order the API
 * lists them — most recently touched first.
 */
export function needingAttention(
  wills: ApiWill[],
  now: Date = new Date(),
): Array<{ will: ApiWill; action: PracticeAction }> {
  return activeWills(wills)
    .map((will) => ({ will, action: practiceActionFor(will, now) }))
    .filter(({ action }) => action.tone === "attention" || action.tone === "ready");
}
