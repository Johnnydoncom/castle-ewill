import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Receipt } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { WillCheckout } from "@/components/payments/WillCheckout";
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
      <PageHead
        kicker="Billing"
        title="Pay for your Will"
        blurb="Charged once, per Will. Everything payable is itemised before you are sent to the gateway."
      />

      {profile?.has_active_subscription && expiresOn && (
        <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-5 py-4 text-sm text-navy">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="leading-relaxed">
            Your subscription is active until {expiresOn}. Amendments to your
            Will on this platform are free until then. Lodging a revised Will
            with the registry is optional and charged separately.
          </p>
        </div>
      )}

      <section className="border border-border bg-background p-6 sm:p-8">
        <WillCheckout
          plans={prices.will}
          review={prices.review}
          subscription={prices.subscription}
          lodging={prices.lodging}
          initialQuotes={prices.quotes}
          flutterwaveEnabled={prices.providers.flutterwave}
          paystackEnabled={prices.providers.paystack}
          hasActiveSubscription={Boolean(profile?.has_active_subscription)}
        />
      </section>

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
