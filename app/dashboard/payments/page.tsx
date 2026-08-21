import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Receipt } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { getPriceList } from "@/lib/pricing";
import { listUserPayments } from "@/lib/actions/payments";
import { getProfile, requireCustomer } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Pay for your Will",
  robots: { index: false, follow: false },
};

/** Prices and payment history are both per-request reads. */
export const dynamic = "force-dynamic";

export default async function DashboardPaymentsPage() {
  // The redirect guard first, then the live account record it does not carry.
  await requireCustomer();

  const [profile, prices, payments] = await Promise.all([
    getProfile(),
    getPriceList(),
    listUserPayments(),
  ]);

  const expiresOn = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/*
        Account-level only.
        
        Paying for a Will moved onto the Will itself — a global checkout had to
        guess which Will a client meant, and guessed wrong the moment they held
        two. What is genuinely account-level stays: one subscription and one
        payment history, however many Wills.
      */}
      <PageHead
        kicker="Billing"
        title="Subscription and receipts"
        blurb="Your subscription, and every payment you have made. Paying for a Will happens on that Will."
      />

      {/*
        Coarse on purpose: this page is about the account's billing history,
        and "at least one of your Wills is covered" is the honest summary.
        Which Will is covered, and until when, belongs on that Will.
      */}
      {profile?.has_active_subscription && expiresOn && (
        <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-5 py-4 text-sm text-navy">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="leading-relaxed">
            You have an active subscription until {expiresOn}. A subscription
            covers one Will — its storage here and its amendments — so check
            each Will for its own cover. Lodging a revised Will with the
            registry is optional and charged separately.
          </p>
        </div>
      )}


      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Your payments</h2>

        {payments.length === 0 ? (
          <p className="border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">
                      {payment.amount_formatted}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {payment.reference}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/payments/${payment.reference}`}
                  className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
                >
                  {payment.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
