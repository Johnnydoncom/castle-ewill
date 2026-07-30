import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";

export const Route = createFileRoute("/admin/wills")({
  head: () => ({
    meta: [
      { title: "Wills — Castle eWill Admin" },
      {
        name: "description",
        content:
          "Monitor every Will on the platform: stage, solicitor assignment, witnesses and sealing status.",
      },
      { property: "og:title", content: "Wills — Castle eWill Admin" },
      { property: "og:description", content: "Platform-wide Will register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminWills,
});

const wills = [
  ["CW-2026-0148", "Ada Okafor", "Drafting", "E. Okafor", "1 / 2"],
  ["CW-2026-0147", "Tunde Bakare", "In review", "T. Adeyemi", "2 / 2"],
  ["CW-2026-0146", "Ngozi Eze", "Sealed", "E. Okafor", "2 / 2"],
  ["CW-2026-0145", "Samuel Ojo", "Drafting", "Unassigned", "0 / 2"],
];

function AdminWills() {
  return (
    <>
      <PageHead
        kicker="Registry · Section III"
        title="Wills"
        blurb="Each matter carries a registry number from first draft through sealing."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {wills.map(([ref, client, stage, counsel, witnesses]) => (
          <article key={ref} className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">{ref}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${
                  stage === "Sealed"
                    ? "bg-navy text-navy-foreground"
                    : stage === "In review"
                      ? "bg-gold/15 text-navy"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stage}
              </span>
            </div>
            <h2 className="mt-2 font-serif text-lg text-navy">{client}</h2>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3 border-b border-border pb-2">
                <dt className="text-muted-foreground">Counsel</dt>
                <dd className="text-navy">{counsel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Witnesses</dt>
                <dd className="text-navy">{witnesses}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
