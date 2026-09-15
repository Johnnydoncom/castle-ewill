import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { PaymentBanner } from "@/components/payments/PaymentBanner";
import { JOURNEY_STAGE_LABELS } from "@/components/will/JourneyBar";
import type { DashboardData } from "@/lib/actions/dashboard";
import type { Profile } from "@/lib/actions/guards";
import { JOURNEY_STAGES } from "@/lib/actions/will";
import { REVIEW_TRIGGERS } from "@/lib/company";
import {
  RENEWAL_WINDOW_DAYS,
  activeWills,
  completionOf,
  needingAttention,
  practiceActionFor,
  summarisePractice,
  testatorOf,
  type PracticeTone,
} from "@/lib/dashboard/practice";

/** ISO-8601 from the API to something a person reads. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TONE: Record<PracticeTone, string> = {
  attention: "border-gold/50 bg-gold/10 text-navy",
  ready: "border-success/40 bg-success/10 text-success",
  progress: "border-border bg-background text-muted-foreground",
  done: "border-navy/15 bg-navy/5 text-navy",
};

/** Client Wills listed here before the lawyer is sent on to My Wills. */
const TABLE_ROWS = 10;

function StatusChip({ tone, children }: { tone: PracticeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

function ClientName({ name }: { name: string | null }) {
  return name ? (
    <span className="font-serif text-base text-navy">{name}</span>
  ) : (
    <span className="font-serif text-base italic text-muted-foreground">Client not yet named</span>
  );
}

/**
 * A lawyer's dashboard: their practice rather than a Will (2026-09-15).
 *
 * A client's dashboard leads with the one Will they hold. A lawyer draws Wills
 * for many clients at once, so the same layout showed whichever client's Will
 * was touched last and hid the rest. This one leads with the practice — how
 * many client Wills are at each point, which of them are waiting on the lawyer
 * — then lists every client Will with its stage and its next action.
 *
 * Everything shown is the server's: each Will's journey decides where it stands
 * and what printing waits on. `lib/dashboard/practice.ts` only counts and words
 * those answers.
 */
export function PracticeDashboard({
  profile,
  data,
  paymentOutcome,
}: {
  profile: Profile;
  data: DashboardData;
  paymentOutcome?: string;
}) {
  const now = new Date();
  const wills = activeWills(data.wills);
  const summary = summarisePractice(data.wills, now);
  const attention = needingAttention(data.wills, now);

  const firstName = profile.first_name || (profile.name ?? profile.email).split(" ")[0];
  const isVerified = profile.is_verified_lawyer === true;
  const rejectedReason = profile.lawyer_rejected_reason ?? null;

  const tiles: Array<{ label: string; value: number; note: string; flag?: boolean }> = [
    { label: "Client Wills", value: summary.total, note: "on your books" },
    { label: "In drafting", value: summary.drafting, note: "still being written" },
    { label: "Awaiting payment", value: summary.awaitingPayment, note: "complete, not yet paid", flag: true },
    { label: "Ready to print", value: summary.readyToPrint, note: "paid and cleared", flag: true },
    { label: "Issued", value: summary.issued, note: "printed for signing" },
    { label: "Renewals due", value: summary.renewalsDue, note: `within ${RENEWAL_WINDOW_DAYS} days`, flag: true },
  ];

  type AccountRow = { key: string; done: boolean; label: string; detail?: string | null; href?: string | null };

  const accountRows = (
    [
      {
        key: "enrolment",
        done: isVerified,
        label: isVerified
          ? "Enrolment confirmed"
          : rejectedReason
            ? "Enrolment not confirmed"
            : "Enrolment being checked",
        detail: profile.enrolment_number ? `Enrolment no. ${profile.enrolment_number}` : null,
      },
      {
        key: "identity",
        done: data.account.is_kyc_verified,
        label: data.account.is_kyc_verified ? "Identity confirmed" : "Identity check outstanding",
        detail: "Once, and it covers every client Will you draw",
        href: data.account.is_kyc_verified ? null : "/dashboard/kyc",
      },
      data.account.requires_email_verification && {
        key: "email",
        done: data.account.is_email_verified,
        label: "Email confirmed",
      },
      {
        key: "two-factor",
        done: data.account.two_factor_enabled,
        label: data.account.two_factor_enabled
          ? "Two-factor authentication on"
          : "Two-factor authentication off",
        detail: data.account.two_factor_enabled ? null : "Recommended — you hold clients' Wills",
        href: data.account.two_factor_enabled ? null : "/dashboard/settings",
      },
    ] as Array<AccountRow | false>
  ).filter((row): row is AccountRow => Boolean(row));

  return (
    <div className="space-y-10">
      <PaymentBanner outcome={paymentOutcome} />

      {/*
        The enrolment number, while it is unconfirmed. Until an administrator
        has checked it against the roll the account works as an individual's —
        one Will — so the lawyer is told why before they go looking for the
        button to start a second.
      */}
      {!isVerified && (
        <div className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="leading-relaxed">
            {rejectedReason ? (
              <>
                <span className="font-medium">We could not confirm your enrolment number.</span>{" "}
                {rejectedReason} Until it is confirmed this account can hold one Will.{" "}
                <Link href="/contact" className="underline underline-offset-4 hover:text-gold">
                  Contact us
                </Link>{" "}
                to put it right.
              </>
            ) : (
              <>
                <span className="font-medium">We are checking your enrolment number.</span>{" "}
                Until it is confirmed this account can hold one Will; once it is, you can draw a
                Will for each of your clients.
              </>
            )}
          </p>
        </div>
      )}

      {!data.account.is_kyc_verified && (
        <Link
          href="/dashboard/kyc"
          className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy transition-colors hover:bg-gold/10"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span className="leading-relaxed">
            <span className="font-medium">Confirm your identity once.</span> It is your identity
            that is checked, not your clients&apos;, and one check covers every Will you draw.
          </span>
          <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0" />
        </Link>
      )}

      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-10 shrink-0 bg-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Practice overview
            </p>
          </div>
          <h1 className="font-serif text-3xl tracking-tight text-navy sm:text-4xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your clients&apos; Wills at a glance — where each one stands, and what it is waiting on.
          </p>
        </div>

        {/* No prefetch: opening the new-Will route can create a Will. */}
        {profile.may_hold_multiple_wills && (
          <Link
            href="/dashboard/will/new"
            prefetch={false}
            className="inline-flex items-center gap-2 bg-navy px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            <Plus className="h-4 w-4" />
            Start a new Will
          </Link>
        )}
      </header>

      {/* The practice in six numbers. */}
      <section
        aria-label="Your practice at a glance"
        className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 xl:grid-cols-6"
      >
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-background p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {tile.label}
            </p>
            <p
              className={`mt-3 font-serif text-4xl ${
                tile.flag && tile.value > 0 ? "text-gold" : "text-navy"
              }`}
            >
              {tile.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{tile.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* What is waiting on the lawyer, or ready for them. */}
        <div className="border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-lg text-navy">Needs your attention</h2>
            {attention.length > 0 && (
              <span className="bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                {attention.length}
              </span>
            )}
          </div>

          {attention.length > 0 ? (
            <ul className="mt-5 divide-y divide-border">
              {attention.slice(0, 6).map(({ will, action }) => (
                <li key={will.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                  <div className="min-w-0 flex-1">
                    <ClientName name={testatorOf(will)} />
                    <p className="mt-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                      {will.reference}
                    </p>
                  </div>
                  <StatusChip tone={action.tone}>{action.label}</StatusChip>
                  <Link
                    href={action.href}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy underline-offset-4 hover:text-gold hover:underline"
                  >
                    {action.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm italic text-muted-foreground">
              {wills.length === 0
                ? "No client Wills yet. Start one and it will appear here when it needs you."
                : "Nothing is waiting on you. Every client Will is moving."}
            </p>
          )}
        </div>

        {/* The account every client Will rests on. */}
        <div className="border border-border bg-surface p-6 sm:p-8">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Your practice account
          </p>
          <p className="mt-3 font-serif text-xl text-navy">{profile.name ?? profile.email}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>

          <ul className="mt-6 space-y-4 border-t border-border pt-6">
            {accountRows.map((row) => (
              <li key={row.key} className="flex items-start gap-3 text-sm">
                <ShieldCheck
                  className={`mt-0.5 h-4 w-4 shrink-0 ${row.done ? "text-success" : "text-gold"}`}
                />
                <div className="min-w-0">
                  {row.href ? (
                    <Link href={row.href} className="text-navy underline underline-offset-4 hover:text-gold">
                      {row.label}
                    </Link>
                  ) : (
                    <p className={row.done ? "text-navy" : "text-muted-foreground"}>{row.label}</p>
                  )}
                  {row.detail && <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>}
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/dashboard/settings"
            className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-navy underline underline-offset-4 hover:text-gold"
          >
            Account settings &rarr;
          </Link>
        </div>
      </section>

      {/* Every client Will, with where it stands and the next thing to do. */}
      <section className="border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 className="font-serif text-lg text-navy">Client Wills</h2>
            <p className="text-xs text-muted-foreground">
              {wills.length === 1 ? "1 Will" : `${wills.length} Wills`}, most recently updated first
            </p>
          </div>
          {wills.length > 0 && (
            <Link
              href="/dashboard/wills"
              className="text-xs uppercase tracking-[0.2em] text-navy underline underline-offset-4 hover:text-gold"
            >
              {wills.length > TABLE_ROWS ? `View all ${wills.length}` : "My Wills"} &rarr;
            </Link>
          )}
        </div>

        {wills.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-4 font-serif text-xl text-navy">No client Wills yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Each client&apos;s Will is its own record, with its own payment and subscription.
            </p>
          </div>
        ) : (
          <>
            {/* A table where there is room for one. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th scope="col" className="px-8 py-3 font-semibold">Client</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Stage</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Progress</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                    <th scope="col" className="px-8 py-3 text-right font-semibold">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wills.slice(0, TABLE_ROWS).map((will) => {
                    const action = practiceActionFor(will, now);
                    const stage = will.journey?.stage;
                    const percent = completionOf(will);

                    return (
                      <tr key={will.id} className="transition-colors hover:bg-surface">
                        <td className="px-8 py-4">
                          <ClientName name={testatorOf(will)} />
                          <p className="mt-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                            {will.reference}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-navy">
                          {stage ? (
                            <>
                              {JOURNEY_STAGE_LABELS[stage]}
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                {JOURNEY_STAGES.indexOf(stage) + 1}/{JOURNEY_STAGES.length}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              role="progressbar"
                              aria-label={`${percent}% complete`}
                              aria-valuenow={percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              className="h-1 w-20 bg-border"
                            >
                              <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusChip tone={action.tone}>{action.label}</StatusChip>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatDate(will.updated_at)}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <Link
                            href={action.href}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-navy hover:text-gold"
                          >
                            {action.cta}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* A list where there is not. */}
            <ul className="divide-y divide-border md:hidden">
              {wills.slice(0, TABLE_ROWS).map((will) => {
                const action = practiceActionFor(will, now);
                const stage = will.journey?.stage;

                return (
                  <li key={will.id}>
                    <Link href={action.href} className="block px-6 py-5 transition-colors hover:bg-surface">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <ClientName name={testatorOf(will)} />
                          <p className="mt-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                            {will.reference}
                          </p>
                        </div>
                        <StatusChip tone={action.tone}>{action.label}</StatusChip>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {stage ? `${JOURNEY_STAGE_LABELS[stage]} · ` : ""}
                        {completionOf(will)}% complete · updated {formatDate(will.updated_at)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy">Notifications</h2>
            {data.unread_notifications > 0 && (
              <span className="bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                {data.unread_notifications} new
              </span>
            )}
          </div>

          {data.notifications.length > 0 ? (
            <ul className="mt-6 space-y-4">
              {data.notifications.slice(0, 5).map((item) => (
                <li key={item.id} className="border-l-2 border-border pl-4">
                  <p className="text-sm font-medium text-navy">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm italic text-muted-foreground">
              Nothing needs your attention right now.
            </p>
          )}
        </div>

        <div className="border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy">Recent payments</h2>
            <Link
              href="/dashboard/payments"
              className="text-xs uppercase tracking-[0.2em] text-navy underline underline-offset-4 hover:text-gold"
            >
              Billing &rarr;
            </Link>
          </div>

          {data.payments.length > 0 ? (
            <ul className="mt-6 divide-y divide-border">
              {data.payments.map((payment) => (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/payments/${payment.reference}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-gold"
                  >
                    <div>
                      <p className="text-sm text-navy">{payment.amount_formatted}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {payment.reference} · {formatDate(payment.paid_at ?? payment.created_at)}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {payment.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm italic text-muted-foreground">No payments recorded yet.</p>
          )}
        </div>
      </section>

      <section className="border border-border bg-surface p-6 sm:p-8">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Worth raising with clients
        </p>
        <h2 className="mt-3 font-serif text-xl text-navy">
          Life changes. Your clients&apos; Wills should keep up.
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_TRIGGERS.map((trigger) => (
            <div key={trigger.label} className="border-t border-gold/40 pt-4">
              <p className="font-serif text-sm text-navy">{trigger.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{trigger.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
