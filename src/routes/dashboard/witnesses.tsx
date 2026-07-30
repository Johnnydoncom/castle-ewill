import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/witnesses")({
  head: () => ({
    meta: [
      { title: "Witnesses — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Invite and track the two adult witnesses required to validly execute your Nigerian Will.",
      },
      { property: "og:title", content: "Witnesses — Castle eWill Dashboard" },
      { property: "og:description", content: "Track your signing witnesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WitnessesPage,
});

const witnesses = [
  { name: "Chidi Nwosu", email: "chidi.n@example.com", status: "Confirmed", note: "Accepted 22 Jul 2026" },
  { name: "Awaiting second witness", email: "—", status: "Pending", note: "Not yet invited" },
];

function WitnessesPage() {
  return (
    <>
      <PageHead
        kicker="Section IV"
        title="Witnesses"
        blurb="Nigerian law requires two adult witnesses present at signing. Neither may be a beneficiary under the Will."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {witnesses.map((w) => (
            <div
              key={w.name}
              className="grid gap-3 rounded-2xl border border-border bg-background p-5 sm:flex sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0">
                <p className="font-serif text-lg text-navy">{w.name}</p>
                <p className="truncate text-xs text-muted-foreground">{w.email}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {w.note}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium ${
                  w.status === "Confirmed"
                    ? "bg-gold/15 text-navy"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {w.status}
              </span>
            </div>
          ))}
          <Button className="w-full bg-navy text-navy-foreground hover:bg-navy/90 sm:w-auto">
            Invite a witness
          </Button>
        </div>

        <aside className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Note from counsel
          </p>
          <p className="mt-3 text-sm leading-relaxed text-navy">
            A gift to a witness — or to a witness's spouse — is void, even though the
            Will itself remains valid. Choose neutral parties: a colleague, neighbour
            or family friend who inherits nothing.
          </p>
          <p className="mt-4 text-xs italic text-muted-foreground">— Barr. T. Adeyemi</p>
        </aside>
      </div>
    </>
  );
}
