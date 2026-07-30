import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import { Button } from "@/components/ui/button";
import legacyStill from "@/assets/legacy-still-life.jpg";

export const Route = createFileRoute("/dashboard/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Your sealed vault: Will drafts, asset inventories and identity documents, encrypted end to end.",
      },
      { property: "og:title", content: "Documents — Castle eWill Dashboard" },
      { property: "og:description", content: "Your encrypted document vault." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const docs = [
  ["Draft Will v.3", "PDF · 214 KB", "29 Jul 2026", "Draft"],
  ["Asset inventory", "PDF · 88 KB", "24 Jul 2026", "Final"],
  ["ID — international passport", "IMG · 1.1 MB", "18 Jul 2026", "Verified"],
  ["Property deed — Lekki", "PDF · 640 KB", "11 Jul 2026", "Final"],
  ["Counsel review notes", "PDF · 46 KB", "27 Jul 2026", "Advisory"],
];

function DocumentsPage() {
  return (
    <>
      <PageHead
        kicker="Section III"
        title="Sealed Vault"
        blurb="Everything you upload is encrypted with AES-256 and released only to the executors you name."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-background lg:col-span-2">
          <ul className="divide-y divide-border">
            {docs.map(([name, meta, date, tag]) => (
              <li key={name} className="grid gap-2 p-5 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{name}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {meta} · {date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                  <button className="text-xs text-navy underline underline-offset-4 hover:text-gold">
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-6 text-center">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Add to vault
            </p>
            <p className="mt-2 text-sm text-navy">
              Deeds, share certificates, insurance policies — drop them here.
            </p>
            <Button className="mt-4 w-full bg-navy text-navy-foreground hover:bg-navy/90">
              Upload document
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <img src={legacyStill} alt="" className="h-36 w-full object-cover" />
            <div className="p-5">
              <p className="font-serif text-sm text-navy">Storage</p>
              <p className="mt-1 text-xs text-muted-foreground">2.1 GB of 10 GB used</p>
              <div className="mt-3 h-[2px] bg-border">
                <div className="h-full w-[21%] bg-gold-gradient" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
