import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";

import { getOrCreateDraft } from "@/lib/actions/will";
import { conflictingWitnesses } from "@/lib/will/conflicts";
import { PageHead } from "@/components/dashboard/PageHead";

export const metadata: Metadata = {
  title: "Witnesses",
  robots: { index: false, follow: false },
};

export default async function WitnessesPage() {
  // The API scopes the draft to the caller, so there is no user id to pass and
  // none to get wrong.
  const will = await getOrCreateDraft();

  const witnesses = will?.witnesses ?? [];
  const beneficiaries = will?.beneficiaries ?? [];

  // Surfaced here as well as in the wizard: this is the rule people most often
  // fall foul of, and it voids the gift rather than the Will. The server
  // enforces it at step eight regardless of what this page shows.
  const clashes = conflictingWitnesses(
    beneficiaries.map((b) => b.full_name),
    witnesses.map((w) => w.full_name),
  );

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Witnesses"
        title="Witnesses"
        blurb="Nigerian law requires two adult witnesses present together at signing. Neither may inherit under the Will."
      />

      {clashes.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm text-navy"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="leading-relaxed">
            <span className="font-medium">{clashes.join(" and ")}</span> is named both as a witness
            and as a beneficiary. A gift to an attesting witness is void — please choose an
            independent witness before signing.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-xl text-navy">
            Your witnesses{" "}
            <span className="text-sm text-muted-foreground">({witnesses.length} of 2)</span>
          </h2>
          <Link
            href="/dashboard/will?step=8"
            className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {witnesses.length === 0 ? "Add witnesses" : "Edit witnesses"}
          </Link>
        </div>

        {witnesses.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm italic text-muted-foreground">
              No witnesses recorded yet. You will be asked for them at step eight of the Will
              builder.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {witnesses.map((witness, index) => {
              const conflicted = clashes.includes(witness.full_name ?? "");
              return (
                <li key={witness.id} className="px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                        Witness {index + 1}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-navy">{witness.full_name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {witness.occupation ?? "Occupation not recorded"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {witness.address}
                      </p>
                      {(witness.email || witness.phone) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[witness.email, witness.phone].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        conflicted
                          ? "border-destructive/50 text-destructive"
                          : "border-success/50 text-success"
                      }`}
                    >
                      {!conflicted && <CheckCircle2 className="h-3 w-3" />}
                      {conflicted ? "Conflict" : "Recorded"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-l-2 border-gold/40 bg-gold/5 px-6 py-5">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          How signing must happen
        </p>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-navy/80">
          <li>
            1. You sign the Will while <strong>both</strong> witnesses watch — together, at the same
            time.
          </li>
          <li>
            2. Each witness then signs while you watch. All three of you remain in the room
            throughout.
          </li>
          <li>
            3. Neither witness, nor the spouse of a witness, may inherit anything under the Will.
          </li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          A Will signed any other way risks being refused by the probate registry, however carefully
          it was drafted.
        </p>
      </section>
    </div>
  );
}
