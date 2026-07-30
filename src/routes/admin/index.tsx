import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import officeInterior from "@/assets/office-interior.jpg";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Registry Overview — Castle eWill Admin" },
      {
        name: "description",
        content:
          "Administrator console: client growth, Wills in review, revenue and platform activity at a glance.",
      },
      { property: "og:title", content: "Registry Overview — Castle eWill Admin" },
      { property: "og:description", content: "Castle administration console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOverview,
});

const stats = [
  ["I", "10,482", "Registered clients"],
  ["II", "6,314", "Wills executed"],
  ["III", "₦412.6M", "Fees collected"],
  ["IV", "6", "Awaiting review"],
];

const queue = [
  ["Ada Okafor", "Family", "Beneficiaries", "29 Jul 2026"],
  ["Tunde Bakare", "Estate", "Trust structure", "29 Jul 2026"],
  ["Ngozi Eze", "Essential", "Review & sign", "28 Jul 2026"],
  ["Samuel Ojo", "Family", "Executors", "28 Jul 2026"],
];

function AdminOverview() {
  return (
    <>
      <PageHead
        kicker="Registry · Section I"
        title="Overview"
        blurb="The state of the house — clients, drafts in flight, and matters awaiting counsel."
      />

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([n, value, label]) => (
          <div key={label} className="rounded-2xl border border-border bg-background p-5">
            <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {n}
            </span>
            <dt className="mt-3 font-serif text-2xl text-navy sm:text-3xl">{value}</dt>
            <dd className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6 lg:col-span-2">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Counsel queue
          </p>
          <h2 className="mt-1 font-serif text-xl text-navy">Awaiting review</h2>
          <ul className="mt-5 divide-y divide-border">
            {queue.map(([name, plan, stage, date]) => (
              <li key={name} className="grid gap-1 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{name}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {plan} · {stage}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-navy bg-navy text-navy-foreground">
          <img src={officeInterior} alt="" className="h-40 w-full object-cover opacity-70" />
          <div className="p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              This week
            </p>
            <h3 className="mt-2 font-serif text-xl">184 new drafts opened</h3>
            <p className="mt-2 text-sm text-navy-foreground/75">
              Up 12% on last week. Lagos remains the leading registry by volume,
              followed by Abuja and Port Harcourt.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
