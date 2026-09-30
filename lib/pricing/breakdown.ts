import type { PriceQuote, QuoteLine } from "./types";

/**
 * The lines a plan card breaks its price into.
 *
 * Everything the server quoted, except a subscription the plan already
 * includes. Every Will plan carries a year of it, and the card's own feature
 * list says so in the client's words — "Free Will updates for one year".
 * Listing it again as "Annual subscription · Included" said the same thing
 * twice, the second time in our vocabulary rather than theirs.
 *
 * Nothing is recomputed: an included line is a zero-amount one, so dropping
 * it cannot move the total the server composed. A subscription that is
 * *charged* stays, because that one is money.
 *
 * The plan cards only. The checkout and the receipt show every line, because
 * there it is part of a bill somebody is paying.
 */
export function planCardLines(quote: PriceQuote | undefined): QuoteLine[] {
  return (quote?.lines ?? []).filter(
    (line) => !(line.kind === "subscription" && line.is_included),
  );
}
