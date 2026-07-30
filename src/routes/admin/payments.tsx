import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Castle eWill Admin" },
      {
        name: "description",
        content:
          "Fees collected, plan mix and recent transactions across the Castle eWill platform.",
      },
      { property: "og:title", content: "Payments — Castle eWill Admin" },
      { property: "og:description", content: "Revenue and transaction ledger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPayments,
});

const txns = [
  ["29 Jul 2026", "Ada Okafor", "Family", "₦55,000", "Successful"],
  ["29 Jul 2026", "Halima Yusuf", "Essential", "₦25,000", "Successful"],
  ["28 Jul 2026", "Tunde Bakare", "Estate", "₦150,000", "Successful"],
  ["28 Jul 2026", "Samuel Ojo", "Family", "₦55,000", "Refunded"],
];

function AdminPayments() {
  return (
    <>
      <PageHead
        kicker="Registry · Section IV"
        title="Payments"
        blurb="One-time fees, no subscriptions — the ledger of everything collected."
      />

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["₦412.6M", "Collected to date"],
          ["₦8.4M", "This month"],
          ["₦285,000", "Refunded (30d)"],
          ["₦65,300", "Average fee"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-border bg-background p-5">
            <dt className="font-serif text-xl text-navy sm:text-2xl">{v}</dt>
            <dd className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {l}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
        <p className="border-b border-border px-5 py-4 font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Recent transactions
        </p>
        <ul className="divide-y divide-border">
          {txns.map(([date, client, plan, amount, status]) => (
            <li key={date + client} className="grid gap-2 px-5 py-4 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{client}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {plan} · {date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif text-sm text-navy">{amount}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] ${
                    status === "Successful"
                      ? "bg-gold/15 text-navy"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
