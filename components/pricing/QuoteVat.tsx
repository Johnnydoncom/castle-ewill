import type { PriceQuote } from "@/lib/pricing/types";
import { vatRateLabel } from "@/lib/payments/vat";

/**
 * The VAT on a quote, as the server worked it out.
 *
 * Nothing here adds anything up: the subtotal, the VAT and the total are the
 * figures `PriceQuoteBuilder` composed, and they are the amount the gateway is
 * asked for. Two shapes, because the two ways of pricing read differently:
 *
 *  - VAT added on top: the subtotal and the VAT sit above the total.
 *  - Prices that already contain it: the total stands, with a line below it
 *    saying how much of it is VAT.
 *
 * Both render nothing when no VAT is charged.
 */
type QuoteVatProps = Pick<
  PriceQuote,
  "vat_rate_bps" | "prices_include_vat" | "subtotal_formatted" | "vat_formatted"
>;

/** Rows for inside the quote's `<dl>`, above the total. */
export function QuoteVatRows({ quote }: { quote: QuoteVatProps }) {
  if (!(quote.vat_rate_bps > 0) || quote.prices_include_vat) return null;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="text-navy/80">Subtotal</dt>
        <dd className="shrink-0 tabular-nums text-navy">{quote.subtotal_formatted}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-navy/80">VAT ({vatRateLabel(quote.vat_rate_bps)})</dt>
        <dd className="shrink-0 tabular-nums text-navy">{quote.vat_formatted}</dd>
      </div>
    </>
  );
}

/** Rows for inside the quote's `<dl>`, below the total. */
export function QuoteVatNote({ quote }: { quote: QuoteVatProps }) {
  if (!(quote.vat_rate_bps > 0) || !quote.prices_include_vat) return null;

  return (
    <div className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
      <dt>Includes VAT ({vatRateLabel(quote.vat_rate_bps)})</dt>
      <dd className="shrink-0 tabular-nums">{quote.vat_formatted}</dd>
    </div>
  );
}
