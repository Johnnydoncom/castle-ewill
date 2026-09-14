import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { PrintReceiptButton } from "@/components/payments/PrintReceiptButton";
import { getPaymentByReference } from "@/lib/actions/payments";
import { COMPANY } from "@/lib/company";
import { paidWith, receiptDate, receiptNotes, receiptStanding } from "@/lib/payments/receipt";

export const metadata: Metadata = {
  title: "Payment receipt",
  robots: { index: false, follow: false },
};

/** A receipt is the caller's own record, read per request. */
export const dynamic = "force-dynamic";

const BADGE_TONES = {
  paid: "border-success/40 bg-success/10 text-success",
  pending: "border-gold/50 bg-gold/10 text-navy",
  unpaid: "border-destructive/40 bg-destructive/5 text-destructive",
  refunded: "border-border bg-surface text-muted-foreground",
} as const;

/**
 * One payment's receipt.
 *
 * This page used to be the bank-transfer instructions screen, so a renewal paid
 * by card still showed "Where to send it" beside bank details that were never
 * set up (redesigned 2026-09-14). It is a receipt now, and nothing else: what
 * was bought — the lines as quoted when the order was placed — for which Will,
 * billed to whom, and how it was paid. Printable as it stands; the dashboard
 * around it stays off the paper.
 */
export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  // Scoped to the signed-in caller by the API, so another client's reference
  // 404s rather than confirming that it exists.
  const detail = await getPaymentByReference(reference);
  if (!detail?.receipt) notFound();

  const { receipt } = detail;
  const standing = receiptStanding(receipt.status);
  const paid = standing.tone === "paid";
  const notes = receiptNotes(receipt);
  const dated = receipt.paid_at ?? receipt.created_at;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Billing
        </Link>
        {paid && <PrintReceiptButton />}
      </div>

      <article className="border border-border bg-background shadow-elegant print:border-0 print:shadow-none">
        {/* Letterhead */}
        <header className="border-t-4 border-gold px-6 pb-8 pt-8 sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <Logo size={44} linked={false} />
            <address className="text-xs not-italic leading-relaxed text-muted-foreground sm:text-right">
              <span className="block font-medium text-navy">{COMPANY.legalName}</span>
              <span className="block">RC {COMPANY.rcNumber}</span>
              {COMPANY.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">{COMPANY.email}</span>
            </address>
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
                {standing.kicker}
              </p>
              <h1 className="mt-2 font-serif text-3xl tracking-tight text-navy sm:text-4xl">
                {standing.title}
              </h1>
            </div>
            <span
              className={`inline-flex items-center border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${BADGE_TONES[standing.tone]}`}
            >
              {standing.badge}
            </span>
          </div>
        </header>

        {/* The amount */}
        <section className="border-y border-border bg-surface px-6 py-6 sm:px-10 print:bg-transparent">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {paid ? "Amount paid" : "Amount"}
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums text-navy">
            {receipt.amount_formatted}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {paid && receipt.paid_at ? `Paid on ${receiptDate(receipt.paid_at)}` : standing.note}
          </p>
        </section>

        {/* Details */}
        <dl className="grid gap-x-10 gap-y-6 px-6 py-8 sm:grid-cols-2 sm:px-10">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Receipt number
            </dt>
            <dd className="mt-1 break-all font-mono text-sm tracking-wide text-navy">
              {receipt.reference}
            </dd>
          </div>

          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {paid ? "Date paid" : "Date"}
            </dt>
            <dd className="mt-1 text-sm text-navy">{receiptDate(dated)}</dd>
          </div>

          {receipt.billed_to && (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Billed to
              </dt>
              <dd className="mt-1 text-sm text-navy">
                <span className="block">{receipt.billed_to.name}</span>
                <span className="block break-all text-muted-foreground">{receipt.billed_to.email}</span>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {paid ? "Paid with" : "Payment method"}
            </dt>
            <dd className="mt-1 text-sm text-navy">{paidWith(receipt)}</dd>
          </div>

          {receipt.will && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">For</dt>
              <dd className="mt-1 text-sm text-navy">
                <Link
                  href={`/dashboard/wills/${receipt.will.id}`}
                  className="underline decoration-gold/50 underline-offset-4 hover:text-gold print:no-underline"
                >
                  {receipt.will.title}
                </Link>{" "}
                <span className="font-mono text-xs text-muted-foreground">{receipt.will.reference}</span>
              </dd>
            </div>
          )}
        </dl>

        {/* What was bought */}
        <section className="px-6 pb-8 sm:px-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">What this payment was for</caption>
              <thead>
                <tr className="border-b border-navy text-left text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <th scope="col" className="py-3 pr-4 font-normal">
                    Description
                  </th>
                  <th scope="col" className="py-3 text-right font-normal">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipt.lines.map((line, index) => (
                  <tr key={`${line.label}-${index}`}>
                    <td className="py-3 pr-4 text-navy">
                      {line.label}
                      {line.is_included && (
                        <span className="block text-xs text-muted-foreground">Included in your plan</span>
                      )}
                    </td>
                    <td className="py-3 text-right tabular-nums text-navy">
                      {line.is_included ? (
                        <span className="text-muted-foreground">Included</span>
                      ) : (
                        line.amount_formatted
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy">
                  <th scope="row" className="pr-4 pt-4 text-left font-serif text-base font-normal text-navy">
                    {paid ? "Total paid" : "Total"}
                  </th>
                  <td className="pt-4 text-right font-serif text-xl tabular-nums text-navy">
                    {receipt.amount_formatted}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {notes.length > 0 && (
            <ul className="mt-8 space-y-1 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-relaxed text-navy print:bg-transparent">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-border px-6 py-5 text-xs leading-relaxed text-muted-foreground sm:px-10">
          {paid ? "Issued electronically" : "Recorded"} by {COMPANY.legalName}, RC {COMPANY.rcNumber}.
          Questions about this payment? Email{" "}
          <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4 hover:text-navy">
            {COMPANY.email}
          </a>{" "}
          or call{" "}
          <a href={COMPANY.phoneHref} className="underline underline-offset-4 hover:text-navy">
            {COMPANY.phone}
          </a>
          , quoting <span className="font-mono">{receipt.reference}</span>.
        </footer>
      </article>
    </div>
  );
}
