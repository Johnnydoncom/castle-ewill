import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import signingHands from "@/assets/signing-hands.jpg";

export const Route = createFileRoute("/dashboard/will")({
  head: () => ({
    meta: [
      { title: "My Wills — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Manage your Will drafts, versions and signing status inside your Castle chambers.",
      },
      { property: "og:title", content: "My Wills — Castle eWill Dashboard" },
      { property: "og:description", content: "Manage your Will drafts and versions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WillsPage,
});

const wills = [
  { name: "Last Will & Testament", version: "v.3 draft", status: "In progress", updated: "29 Jul 2026" },
  { name: "Last Will & Testament", version: "v.2", status: "Superseded", updated: "12 Jun 2026" },
  { name: "Last Will & Testament", version: "v.1", status: "Superseded", updated: "18 Apr 2026" },
];

function WillsPage() {
  return (
    <>
      <PageHead
        kicker="Section II"
        title="Will Builder"
        blurb="Every version of your testament, kept in sequence. Only the latest signed copy is legally operative."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background lg:col-span-2">
          <ul className="divide-y divide-border">
            {wills.map((w) => (
              <li key={w.version} className="grid gap-3 p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <p className="font-serif text-lg text-navy">{w.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {w.version} · updated {w.updated}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      w.status === "In progress"
                        ? "bg-gold/15 text-navy"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {w.status}
                  </span>
                  <Link
                    to="/wills/new"
                    className="text-xs text-navy underline underline-offset-4 hover:text-gold"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-navy bg-navy text-navy-foreground">
          <img src={signingHands} alt="" className="h-40 w-full object-cover opacity-70" />
          <div className="p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Begin afresh
            </p>
            <h3 className="mt-2 font-serif text-xl">Start a new Will</h3>
            <p className="mt-2 text-sm text-navy-foreground/75">
              Creating a new Will revokes all earlier versions once signed and witnessed.
            </p>
            <Button asChild className="mt-5 w-full bg-gold text-navy hover:bg-gold/90">
              <Link to="/wills/new">Open the wizard</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function PageHead({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="border-b border-border pb-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-10 shrink-0 bg-gold" />
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          {kicker}
        </p>
      </div>
      <h1 className="font-serif text-3xl tracking-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}
