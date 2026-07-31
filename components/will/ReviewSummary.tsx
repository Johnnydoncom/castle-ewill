import Link from "next/link";

import type { FullWill } from "@/lib/will/repository";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { stepCompletions } from "@/lib/will/completion";
import { toCompletionInput } from "@/lib/will/repository";
import { WILL_STEPS } from "@/lib/will/steps";

/** Read-only summary rendered on step 9, with edit links back to each step. */
export function ReviewSummary({ will }: { will: FullWill }) {
  const completions = new Map(
    stepCompletions(toCompletionInput(will)).map((c) => [c.step, c]),
  );

  const sections: Array<{ step: number; title: string; rows: string[] }> = [
    {
      step: 1,
      title: "Personal details",
      rows: [
        will.fullLegalName ?? "—",
        will.dateOfBirth ? `Born ${will.dateOfBirth}` : "Date of birth missing",
        [will.addressLine1, will.city, will.state].filter(Boolean).join(", ") ||
          "Address missing",
      ],
    },
    {
      step: 2,
      title: "Declaration",
      rows: [
        will.declaredLastWill
          ? "Declared as Last Will and Testament"
          : "Not yet declared",
        will.revokesPriorWills
          ? "Prior Wills revoked"
          : "Prior Wills not revoked",
        will.confirmedSoundMind
          ? "Sound mind and legal age confirmed"
          : "Capacity not confirmed",
      ],
    },
    {
      step: 3,
      title: "Executors",
      rows: will.executors.length
        ? will.executors.map(
            (e) =>
              `${e.fullName}${e.isAlternate ? " (alternate)" : ""} — ${e.address}`,
          )
        : ["No executors appointed"],
    },
    {
      step: 4,
      title: "Beneficiaries",
      rows: will.beneficiaries.length
        ? will.beneficiaries.map(
            (b) =>
              `${b.fullName} (${b.relationship}) — ${
                b.isContingent
                  ? "contingent"
                  : `${Number(b.sharePercent)}%`
              }`,
          )
        : ["No beneficiaries named"],
    },
    {
      step: 5,
      title: "Guardianship",
      rows:
        will.hasMinorChildren === false
          ? ["No minor children — section not applicable"]
          : will.guardians.length
            ? will.guardians.map(
                (g) =>
                  `${g.fullName}${g.isAlternate ? " (alternate)" : ""} — ${g.address}`,
              )
            : ["No guardian appointed"],
    },
    {
      step: 6,
      title: "Specific bequests",
      rows: will.bequests.length
        ? will.bequests.map(
            (b) => `${b.itemDescription} → ${b.recipientName}`,
          )
        : ["None recorded (optional)"],
    },
    {
      step: 7,
      title: "Funeral wishes",
      rows: [
        will.funeralPreference
          ? will.funeralPreference.charAt(0).toUpperCase() +
            will.funeralPreference.slice(1)
          : "No preference recorded",
        will.funeralInstructions ?? "",
      ].filter(Boolean),
    },
    {
      step: 8,
      title: "Witnesses",
      rows: will.witnesses.length
        ? will.witnesses.map((w) => `${w.fullName} — ${w.address}`)
        : ["No witnesses recorded"],
    },
  ];

  return (
    <div className="space-y-px border border-border bg-border">
      {sections
        .filter(
          (section) =>
            !(section.step === 5 && will.hasMinorChildren === false && false),
        )
        .map((section) => {
          const status = completions.get(section.step);
          const stepMeta = WILL_STEPS.find((s) => s.step === section.step);

          return (
            <section key={section.step} className="bg-background p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                    {stepMeta?.numeral}
                  </span>
                  <h3 className="font-serif text-lg text-navy">
                    {section.title}
                  </h3>
                  {status && !status.complete && status.applicable && (
                    <span className="border border-destructive/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                      Incomplete
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/will?step=${section.step}`}
                  className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
                >
                  Edit
                </Link>
              </div>
              <ul className="space-y-1.5 pl-8">
                {section.rows.map((row, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {row}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      <div className="bg-surface px-6 py-4">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Document {will.reference} &middot; Revision {will.version} &middot;{" "}
          {WILL_STATUS_LABELS[will.status] ?? will.status}
        </p>
      </div>
    </div>
  );
}
