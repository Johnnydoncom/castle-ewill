import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { requireUser } from "@/lib/actions/guards";
import { getDashboardData } from "@/lib/actions/dashboard";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { REVIEW_TRIGGERS } from "@/lib/company";
import { PageHead } from "@/components/dashboard/PageHead";
import { PaymentBanner } from "@/components/payments/PaymentBanner";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment: paymentOutcome } = await searchParams;
  const sessionUser = await requireUser();

  // One round trip. The API scopes everything to the bearer token, so there is
  // no user id to pass and none to get wrong.
  const data = await getDashboardData();

  const activeWill = data.primary_will?.will ?? null;
  const resumeStep = data.primary_will?.next_step ?? 1;
  const profilePercent = data.account.profile_completion;

  return (
    <div className="space-y-10">
      <PaymentBanner outcome={paymentOutcome} />

      {/*
        Identity no longer gates *starting* a Will — it is checked after
        payment and before the document is released. So this is a heads-up
        about a step still to come, not a barrier: telling someone they must
        verify "to start" when they can in fact start immediately would send
        them off to a check they do not need yet.
      */}
      {!data.account.is_kyc_verified && (
        <Link
          href="/dashboard/kyc"
          className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy transition-colors hover:bg-gold/10"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span className="leading-relaxed">
            <span className="font-medium">Identity check still to come.</span>{" "}
            Start drafting whenever you like — we confirm your identity once,
            after payment, before releasing your Will.
          </span>
          <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0" />
        </Link>
      )}

      <PageHead
        kicker="Overview"
        title={`Good to see you, ${sessionUser.name.split(" ")[0]}.`}
        blurb="Your Will, your documents and everything awaiting your attention."
      />

      {/* Primary card — the active Will */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="border border-border bg-background p-8">
          {activeWill ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                  {activeWill.reference}
                </span>
                <span className="border border-border px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {WILL_STATUS_LABELS[activeWill.status] ?? activeWill.status}
                </span>
              </div>

              <h2 className="mt-4 font-serif text-2xl text-navy">
                {activeWill.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last updated {formatDate(activeWill.updated_at)}
              </p>

              <div className="mt-8">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Completion
                  </span>
                  <span className="font-serif text-2xl text-navy">
                    {activeWill.completion_percent}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={activeWill.completion_percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 w-full bg-border"
                >
                  <div
                    className="h-full bg-gold transition-all"
                    style={{ width: `${activeWill.completion_percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {activeWill.status === "draft" ? (
                  <Link
                    href={`/dashboard/wills/${activeWill.id}/edit?step=${resumeStep}`}
                    className="group inline-flex items-center gap-3 bg-navy px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
                  >
                    {activeWill.completion_percent === 0
                      ? "Begin your Will"
                      : "Continue drafting"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/wills/${activeWill.id}`}
                    className="inline-flex items-center gap-3 bg-navy px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
                  >
                    Manage your Will
                  </Link>
                )}
                {/*
                  Offered only when the server would honour it. Printing needs
                  a completed Will, a settled payment and a confirmed identity;
                  an unconditional link here handed people a button whose only
                  possible outcome was a 402.
                */}
                {activeWill.journey?.can_print && (
                  <Link
                    href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${activeWill.id}/pdf`}
                    className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <h2 className="mt-4 font-serif text-2xl text-navy">
                No Will yet.
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Four guided steps, plain English throughout. You can pause and
                resume at any point.
              </p>
              <Link
                href="/dashboard/will"
                className="mt-6 inline-flex items-center gap-3 bg-navy px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
              >
                Begin your Will
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Profile completeness */}
        <div className="border border-border bg-surface p-8">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Your profile
          </p>
          <p className="mt-4 font-serif text-4xl text-navy">
            {profilePercent}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">complete</p>

          <ul className="mt-6 space-y-3 border-t border-border pt-6">
            {/*
              * Only the confirmations actually being asked for. Listing
              * "Phone number added" as an outstanding item when an
              * administrator has switched phone verification off reads as
              * an incomplete account that can never be completed.
              */}
            {[
              data.account.requires_email_verification && {
                label: "Email confirmed",
                done: data.account.is_email_verified,
              },
              data.account.requires_phone_verification && {
                label: "Phone number added",
                done: data.account.is_phone_verified,
              },
              {
                label: "Two-factor authentication",
                done: data.account.two_factor_enabled,
              },
            ]
              .filter((item) => typeof item === "object")
              .map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <ShieldCheck
                    className={`h-4 w-4 shrink-0 ${
                      item.done ? "text-success" : "text-border"
                    }`}
                  />
                  <span className={item.done ? "text-navy" : ""}>
                    {item.label}
                  </span>
                </li>
              ))}
          </ul>

          <Link
            href="/dashboard/settings"
            className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-navy underline underline-offset-4 hover:text-gold"
          >
            Complete profile &rarr;
          </Link>
        </div>
      </section>

      {/* Notifications + payments */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-background p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-navy">Notifications</h3>
            {data.unread_notifications > 0 && (
              <span className="bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                {data.unread_notifications} new
              </span>
            )}
          </div>

          {data.notifications.length > 0 ? (
            <ul className="mt-6 space-y-4">
              {data.notifications.map((item) => (
                <li key={item.id} className="border-l-2 border-border pl-4">
                  <p className="text-sm font-medium text-navy">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.body}
                  </p>
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

        <div className="border border-border bg-background p-8">
          <h3 className="font-serif text-lg text-navy">Payments</h3>
          {data.payments.length > 0 ? (
            <ul className="mt-6 divide-y divide-border">
              {data.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm text-navy">
                      {payment.amount_formatted}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {payment.reference}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {payment.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm italic text-muted-foreground">
              No payments recorded yet.
            </p>
          )}
        </div>
      </section>

      {/* Review reminders from the client brief */}
      <section className="border border-border bg-surface p-8">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          When to review
        </p>
        <h3 className="mt-3 font-serif text-xl text-navy">
          Life changes. Your Will should keep up.
        </h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_TRIGGERS.map((trigger) => (
            <div key={trigger.label} className="border-t border-gold/40 pt-4">
              <p className="font-serif text-sm text-navy">{trigger.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {trigger.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
