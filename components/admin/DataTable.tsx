import Link from "next/link";

/** Editorial table primitives shared by the admin registry pages. */

export function StatCard({
  numeral,
  value,
  label,
  hint,
}: {
  numeral: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="border border-border bg-background p-5">
      <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
        {numeral}
      </span>
      <dt className="mt-3 font-serif text-2xl text-navy sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dd>
      {hint && (
        <p className="mt-2 text-[11px] text-muted-foreground/80">{hint}</p>
      )}
    </div>
  );
}

export function Table({
  headers,
  children,
  empty,
  isEmpty,
}: {
  headers: readonly string[];
  children: React.ReactNode;
  empty: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <div className="border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm italic text-muted-foreground">{empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-background">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="bg-muted/30 px-5 py-3.5 font-serif text-[10px] font-normal uppercase tracking-[0.25em] text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        {/*
          `[&>tr]:` rather than a wrapper on each row: every caller writes its
          own `<tr>`, and a hover state is not worth touching eleven pages for.
          It is what makes a row trackable across a wide table.
        */}
        <tbody className="divide-y divide-border [&>tr]:transition-colors [&>tr:hover]:bg-muted/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Cell({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className={`px-5 py-3.5 align-middle ${muted ? "text-muted-foreground" : "text-navy"}`}
    >
      {children}
    </td>
  );
}

const TONES = {
  neutral: "border-border text-muted-foreground",
  info: "border-primary/40 text-primary",
  warn: "border-gold/60 text-gold",
  success: "border-success/50 text-success",
  danger: "border-destructive/40 text-destructive",
} as const;

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}

export function willStatusTone(status: string): keyof typeof TONES {
  switch (status) {
    case "draft":
      return "neutral";
    case "submitted":
    case "under_review":
      return "warn";
    case "approved":
      return "info";
    case "executed":
      return "success";
    default:
      return "neutral";
  }
}

export function paymentStatusTone(status: string): keyof typeof TONES {
  switch (status) {
    case "success":
      return "success";
    case "pending":
      return "warn";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function Pagination({
  page,
  perPage,
  total,
  basePath,
  extraParams = {},
}: {
  page: number;
  perPage: number;
  total: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const pages = Math.max(Math.ceil(total / perPage), 1);
  if (pages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(target));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-border pt-4"
    >
      <p className="text-xs text-muted-foreground">
        Page {page} of {pages} &middot; {total.toLocaleString()} records
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-navy transition-colors hover:border-gold hover:text-gold"
          >
            Previous
          </Link>
        )}
        {page < pages && (
          <Link
            href={href(page + 1)}
            className="border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-navy transition-colors hover:border-gold hover:text-gold"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/**
 * Dates now arrive from the API as ISO-8601 strings rather than as `Date`
 * objects from a driver, so both are accepted. An unparseable value renders as
 * a dash rather than "Invalid Date", which is not something to show an operator
 * in a registry console.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
