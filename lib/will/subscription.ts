/**
 * Where a Will's subscription stands, in the words its pages use.
 *
 * Whether it is active is the server's answer (`has_active_subscription`), not
 * a comparison against this browser's clock; this only turns the expiry into
 * something to read. Kept apart from the components so the wording can be
 * tested without rendering one.
 */
export type SubscriptionStanding =
  | { kind: "active"; until: string }
  | { kind: "ended"; on: string }
  | { kind: "none" };

export function subscriptionStanding(
  expiresAt: string | null,
  isActive: boolean,
): SubscriptionStanding {
  if (!expiresAt) return { kind: "none" };

  return isActive ? { kind: "active", until: expiresAt } : { kind: "ended", on: expiresAt };
}

/** The standing as one line — "Active until 13 September 2027". */
export function describeStanding(standing: SubscriptionStanding): string {
  switch (standing.kind) {
    case "active":
      return `Active until ${readableDate(standing.until)}`;
    case "ended":
      return `Ended on ${readableDate(standing.on)}`;
    case "none":
      return "No subscription yet";
  }
}

/** A date as the client reads it, the same on the server and in the browser. */
export function readableDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}
