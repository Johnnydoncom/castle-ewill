/**
 * How VAT is worded. The amounts are the server's and arrive preformatted —
 * nothing here does money arithmetic, only turns a rate into words.
 */

/** 750 basis points → "7.5%", 1000 → "10%". */
export function vatRateLabel(rateBps: number): string {
  const percent = rateBps / 100;

  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/0+$/, "")}%`;
}

/** The one sentence a price list carries, or null when no VAT is charged. */
export function vatPriceNotice(vat: { rate_bps: number; prices_include_vat: boolean }): string | null {
  if (vat.rate_bps <= 0) return null;

  return vat.prices_include_vat
    ? `All prices include ${vatRateLabel(vat.rate_bps)} VAT.`
    : `All prices are shown before ${vatRateLabel(vat.rate_bps)} VAT, which is added at checkout.`;
}
