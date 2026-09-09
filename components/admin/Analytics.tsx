import Link from "next/link";

import type { TrendPoint } from "@/lib/actions/admin";

/**
 * The overview's analytics, drawn by hand.
 *
 * No charting library: this is two dozen data points, and a 40KB dependency to
 * draw twelve rectangles is weight every administrator downloads so that one
 * page can look busy. Inline SVG renders on the server, needs no client
 * JavaScript at all, and scales properly.
 */

/** A month label a human recognises — "Sep", not "2026-09". */
function monthLabel(month: string): string {
  const [year, m] = month.split("-");

  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NG", {
    month: "short",
  });
}

/**
 * A headline number with its own six-month shape underneath.
 *
 * The sparkline is the point. A lifetime total answers "how much"; it takes
 * the trend beside it to answer "and is that getting better", which is the
 * question somebody opening this page actually has.
 */
export function TrendCard({
  label,
  value,
  points,
  format,
  href,
}: {
  label: string;
  value: string;
  points: TrendPoint[];
  format?: (total: number) => string;
  href?: string;
}) {
  const totals = points.map((point) => point.total);
  const peak = Math.max(...totals, 1);

  /* Month on month, and only when there is a previous month to compare to. */
  const [previous, latest] = [totals.at(-2), totals.at(-1)];

  const delta =
    previous === undefined || latest === undefined || previous === 0
      ? null
      : Math.round(((latest - previous) / previous) * 100);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl text-navy sm:text-3xl">{value}</p>
        </div>

        {delta !== null && (
          <span
            className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
              delta >= 0
                ? "border-success/40 text-success"
                : "border-destructive/40 text-destructive"
            }`}
            title="Against last month"
          >
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>

      {points.length > 0 && (
        <div className="mt-5 flex h-12 items-end gap-1" aria-hidden>
          {points.map((point) => (
            <div
              key={point.month}
              className="flex-1 bg-gold/60"
              style={{ height: `${Math.max((point.total / peak) * 100, 3)}%` }}
            />
          ))}
        </div>
      )}

      {/*
        The chart is decorative; the numbers behind it are not. Screen readers
        and anyone who cannot see colour get the same six figures as a sentence.
      */}
      <p className="sr-only">
        Last six months:{" "}
        {points
          .map((p) => `${monthLabel(p.month)} ${format ? format(p.total) : p.total}`)
          .join(", ")}
      </p>
    </>
  );

  const className =
    "block border border-border bg-background p-5 transition-colors" +
    (href ? " hover:border-navy" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * The full-width chart: one bar per month, labelled and readable.
 *
 * Replaces a bar chart that showed only a count above each column. A figure
 * with no axis is a figure you cannot compare against anything.
 */
export function MonthlyChart({
  title,
  subtitle,
  points,
  format = (n) => n.toLocaleString(),
}: {
  title: string;
  subtitle: string;
  points: TrendPoint[];
  format?: (total: number) => string;
}) {
  const peak = Math.max(...points.map((p) => p.total), 1);

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg text-navy">{title}</h2>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {points.length === 0 ? (
        <p className="mt-8 text-sm italic text-muted-foreground">
          Nothing recorded in the last six months.
        </p>
      ) : (
        <div className="mt-8 flex items-end gap-2 sm:gap-4" style={{ height: 190 }}>
          {points.map((point) => (
            <div
              key={point.month}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="font-serif text-[11px] text-navy sm:text-xs">
                {format(point.total)}
              </span>

              <div
                className="w-full bg-navy/80 transition-colors group-hover:bg-gold"
                style={{ height: `${Math.max((point.total / peak) * 100, 1.5)}%` }}
                role="img"
                aria-label={`${monthLabel(point.month)}: ${format(point.total)}`}
              />

              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {monthLabel(point.month)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Where Wills stop.
 *
 * Each step is a subset of the one before, so the gap between two bars is the
 * proportion of people who got that far and no further — which is the number
 * worth acting on, and the one a table of status counts cannot show.
 */
export function Funnel({
  steps,
}: {
  steps: Array<{ label: string; value: number; hint: string }>;
}) {
  const top = Math.max(steps[0]?.value ?? 0, 1);

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <h2 className="font-serif text-lg text-navy">From draft to document</h2>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Every Will ever started
      </p>

      <ol className="mt-7 space-y-4">
        {steps.map((step, index) => {
          const share = Math.round((step.value / top) * 100);
          const previous = steps[index - 1];

          const dropped =
            previous && previous.value > 0
              ? previous.value - step.value
              : 0;

          return (
            <li key={step.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-navy">{step.label}</span>
                <span className="font-serif text-sm text-navy">
                  {step.value.toLocaleString()}
                  <span className="ml-2 text-xs text-muted-foreground">{share}%</span>
                </span>
              </div>

              <div className="mt-1.5 h-2 w-full bg-border/60">
                <div
                  className="h-full bg-gold"
                  style={{ width: `${Math.max(share, 1)}%` }}
                />
              </div>

              <p className="mt-1 text-[11px] text-muted-foreground">
                {step.hint}
                {dropped > 0 && (
                  <span className="text-destructive">
                    {" "}
                    · {dropped.toLocaleString()} did not get this far
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * What is waiting on a person.
 *
 * These counts were spread across four screens, so the only way to know
 * whether anything needed doing was to visit all four. Rows with nothing
 * outstanding are dropped rather than shown as zero: a list of noughts is
 * noise, and the whole value of this block is that an empty one means there
 * is genuinely nothing to do.
 */
export function AttentionPanel({
  items,
}: {
  items: Array<{ label: string; count: number; href: string }>;
}) {
  const outstanding = items.filter((item) => item.count > 0);

  if (outstanding.length === 0) {
    return (
      <section className="border border-success/40 bg-success/5 px-6 py-5">
        <p className="font-serif text-base text-navy">Nothing is waiting.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No Wills to review, no identities to decide, no transfers to confirm
          and no unread messages.
        </p>
      </section>
    );
  }

  return (
    <section className="border-l-2 border-gold bg-gold/5 px-6 py-5">
      <h2 className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold">
        Needs attention
      </h2>

      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {outstanding.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="group flex items-baseline gap-2.5">
              <span className="font-serif text-xl text-navy">{item.count}</span>
              <span className="text-sm text-navy/80 underline-offset-4 group-hover:underline">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
