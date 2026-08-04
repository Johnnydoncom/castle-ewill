import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, Building2, CheckCircle2, Clock } from "lucide-react";

import { getPaymentByReference } from "@/lib/actions/payments";
import { COMPANY } from "@/lib/company";
import { PageHead } from "@/components/dashboard/PageHead";

export const metadata: Metadata = {
  title: "Payment instructions",
  robots: { index: false, follow: false },
};

export default async function TransferInstructionsPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  // Scoped to the signed-in caller by the API, so another client's reference
  // 404s rather than confirming that it exists.
  const detail = await getPaymentByReference(reference);
  if (!detail) notFound();

  const { payment, account } = detail;
  const configured = account.configured;
  const settled = payment.status === "success";

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Payment"
        title={settled ? "Payment received" : "Complete your transfer"}
        blurb={
          settled
            ? "This payment has been confirmed. Nothing further is needed."
            : "Transfer the amount below, quoting the reference exactly as shown."
        }
      />

      {settled ? (
        <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-5 py-4 text-sm text-navy">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p>
            We received {payment.amount_formatted} against reference{" "}
            <span className="font-medium">{payment.reference}</span>. Thank you.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p>
            Awaiting your transfer. We confirm manually during business hours,
            usually within one working day of the funds arriving.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg text-navy">Where to send it</h2>
          </div>

          {!configured && (
            <div className="mt-5 flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>
                Our bank details are not published yet. Please call{" "}
                <a href={COMPANY.phoneHref} className="underline underline-offset-4">
                  {COMPANY.phone}
                </a>{" "}
                and quote reference {payment.reference}, and we will confirm
                where to send payment.
              </p>
            </div>
          )}

          <dl className="mt-6 divide-y divide-border border-t border-border">
            {[
              ["Bank", account.bank_name],
              ["Account name", account.account_name],
              ["Account number", account.account_number],
              ["Amount", payment.amount_formatted],
              ["Reference", payment.reference],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4"
              >
                <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {label}
                </dt>
                <dd
                  className={
                    label === "Reference" || label === "Account number"
                      ? "break-all font-mono text-sm tracking-wider text-navy"
                      : "text-sm text-navy"
                  }
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 border-l-2 border-gold/40 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-navy/80">
            {account.instructions ??
              "Quote your payment reference exactly as shown, or we cannot match your transfer."}
          </p>
        </section>

        <section className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              What happens next
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-navy/80">
              <li>1. You make the transfer, quoting the reference.</li>
              <li>2. We match it against your account and confirm it.</li>
              <li>3. You receive an email, and your dashboard updates.</li>
            </ol>
          </div>

          <div className="border border-border bg-background p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Prefer to pay by card?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Card payments confirm instantly rather than waiting on a manual
              check.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-navy underline underline-offset-4 hover:text-gold"
            >
              Back to pricing &rarr;
            </Link>
          </div>
        </section>
      </div>

      <Link
        href="/dashboard"
        className="inline-block text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
      >
        &larr; Back to dashboard
      </Link>
    </div>
  );
}
