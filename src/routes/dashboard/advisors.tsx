import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import { Button } from "@/components/ui/button";
import advisorPortrait from "@/assets/advisor-portrait.jpg";
import officeInterior from "@/assets/office-interior.jpg";

export const Route = createFileRoute("/dashboard/advisors")({
  head: () => ({
    meta: [
      { title: "Advisors — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Book a review with a qualified Nigerian estate lawyer and read counsel notes on your draft.",
      },
      { property: "og:title", content: "Advisors — Castle eWill Dashboard" },
      { property: "og:description", content: "Your estate counsel and review notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdvisorsPage,
});

function AdvisorsPage() {
  return (
    <>
      <PageHead
        kicker="Section V"
        title="Advisors"
        blurb="Practising Nigerian solicitors review every Will before it is sealed. Book time when you need it."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <img src={advisorPortrait} alt="Estate advisor portrait" className="h-56 w-full object-cover" />
          <div className="p-6">
            <p className="font-serif text-lg text-navy">Barr. Emeka Okafor</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Head of Estate Practice
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Assigned to your file. 14 years in probate and succession, Lagos.
            </p>
            <Button className="mt-5 w-full bg-navy text-navy-foreground hover:bg-navy/90">
              Book 20 minutes
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 lg:col-span-2">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Review log
          </p>
          <h2 className="mt-1 font-serif text-xl text-navy">Counsel notes</h2>
          <ul className="mt-5 space-y-4">
            {[
              ["27 Jul 2026", "Clarify the residuary clause — name a fallback beneficiary."],
              ["27 Jul 2026", "Confirm the Lekki property title is in your sole name."],
              ["14 Jun 2026", "Guardianship wording approved as drafted."],
            ].map(([d, note]) => (
              <li key={note} className="grid gap-1 border-b border-border pb-4 last:border-0 sm:flex sm:gap-6">
                <span className="w-28 shrink-0 font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {d}
                </span>
                <p className="min-w-0 flex-1 text-sm text-navy">{note}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 overflow-hidden rounded-xl">
            <img src={officeInterior} alt="Castle estate practice office" className="h-40 w-full object-cover" />
          </div>
        </div>
      </div>
    </>
  );
}
