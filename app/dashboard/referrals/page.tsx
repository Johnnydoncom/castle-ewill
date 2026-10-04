import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gift, Wallet } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { ShareReferral } from "@/components/referrals/ShareReferral";
import { requireCustomer } from "@/lib/actions/guards";
import { getReferrals, getWallet } from "@/lib/actions/referrals";

export const metadata: Metadata = {
  title: "Refer and earn",
  robots: { index: false, follow: false },
};

/** The account's own code, earnings and statement — per request, never cached. */
export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardReferralsPage() {
  await requireCustomer();

  const [referrals, wallet] = await Promise.all([getReferrals(), getWallet()]);

  // The API answers 404 to an account that cannot refer.
  if (!referrals) notFound();

  // The rate is the server's, in basis points; 500 reads as "5%".
  const rate = `${referrals.commission_rate_bps / 100}%`;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHead
        kicker="Refer and earn"
        title="Recommend us, and earn"
        blurb={`Share your code. When somebody opens an account with it and pays for their plan, ${rate} of the plan's price is added to your wallet.`}
      />

      {!referrals.enabled && (
        <p className="border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
          The referral programme is paused, so new payments are not earning
          commission at the moment. What you have already earned stays in your
          wallet.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <section className="border border-border bg-background p-6 sm:p-8">
          <ShareReferral code={referrals.code} link={referrals.link} />
        </section>

        <section className="flex flex-col justify-between border border-border bg-navy p-6 text-white sm:w-64 sm:p-8">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Wallet balance
            </p>
          </div>
          <p className="mt-4 font-serif text-3xl tracking-tight">
            {wallet?.balance_formatted ?? "₦0.00"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {referrals.stats.signed_up === 1
              ? "1 person has joined with your code"
              : `${referrals.stats.signed_up} people have joined with your code`}
            {referrals.stats.rewarded > 0 && `; ${referrals.stats.rewarded} paid`}.
          </p>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ["I", "They sign up", "Somebody opens an account using your link, or types your code when they register."],
            ["II", "They pay", "They choose a plan for their Will and pay for it. Nothing is earned until that payment is confirmed."],
            ["III", "You earn", `${rate} of their plan's price is added to your wallet, once, on their first plan.`],
          ].map(([numeral, title, body]) => (
            <li key={numeral} className="border border-border bg-background p-5">
              <p className="font-serif text-sm italic text-gold">{numeral}</p>
              <p className="mt-2 text-sm font-medium text-navy">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">People you referred</h2>

        {referrals.referrals.length === 0 ? (
          <p className="border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            Nobody has joined with your code yet.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {referrals.referrals.map((referral) => (
              <li
                key={referral.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{referral.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Joined {formatDate(referral.joined_at)}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-xs">
                  {referral.status === "rewarded" ? (
                    <>
                      <span className="block text-sm font-medium text-success">
                        +{referral.commission_formatted}
                      </span>
                      <span className="text-muted-foreground">
                        Earned {formatDate(referral.rewarded_at)}
                      </span>
                    </>
                  ) : (
                    <span className="uppercase tracking-[0.15em] text-muted-foreground">
                      Not paid yet
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Wallet statement</h2>

        {!wallet || wallet.transactions.length === 0 ? (
          <p className="border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            Your earnings will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {wallet.transactions.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-navy">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(entry.created_at)} · balance {entry.balance_after_formatted}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-medium ${entry.type === "credit" ? "text-success" : "text-navy"}`}
                >
                  {entry.type === "credit" ? "+" : "−"}
                  {entry.amount_formatted}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
