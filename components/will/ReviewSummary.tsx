import Link from "next/link";

import type { ApiWill } from "@/lib/actions/will";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { WILL_STEPS } from "@/lib/will/steps";

/**
 * Read-only summary rendered on step 9, with edit links back to each step.
 *
 * The per-step tick marks come from `will.progress`, computed by the API using
 * the same rules that gate submission — so a section shown as complete here is
 * one the server agrees is complete.
 */
export function ReviewSummary({ will }: { will: ApiWill }) {
  const completions = new Map(
    (will.progress?.steps ?? []).map((c) => [c.step, c]),
  );

  const sections: Array<{ step: number; title: string; rows: string[] }> = [
    {
      step: 1,
      title: "Personal details",
      rows: [
        will.personal.full_legal_name ?? "—",
        will.personal.date_of_birth ? `Born ${will.personal.date_of_birth}` : "Date of birth missing",
        [will.personal.address_line1, will.personal.city, will.personal.state].filter(Boolean).join(", ") ||
          "Address missing",
      ],
    },
    {
      step: 2,
      title: "Declaration",
      rows: [
        will.declaration.declared_last_will
          ? "Declared as Last Will and Testament"
          : "Not yet declared",
        will.declaration.revokes_prior_wills
          ? "Prior Wills revoked"
          : "Prior Wills not revoked",
        will.declaration.confirmed_sound_mind
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
              `${e.full_name}${e.is_alternate ? " (alternate)" : ""} — ${e.address}`,
          )
        : ["No executors appointed"],
    },
    {
      step: 4,
      title: "Specific bequests",
      rows: will.bequests.length
        ? will.bequests.map(
            (b) => `${b.item_description} → ${b.recipient_name}`,
          )
        : will.bequests_declared_none
          ? ["No specific gifts — everything forms the residuary estate"]
          : ["Not yet answered"],
    },
    {
      step: 5,
      title: "Guardianship",
      rows:
        will.has_minor_children === false
          ? ["No minor children — section not applicable"]
          : will.guardians.length
            ? will.guardians.map(
                (g) =>
                  `${g.full_name}${g.is_alternate ? " (alternate)" : ""} — ${g.address}`,
              )
            : ["No guardian appointed"],
    },
    {
      step: 6,
      title: "Share of residuary estate",
      rows: will.beneficiaries.length
        ? will.beneficiaries.map(
            (b) =>
              `${b.full_name} (${b.relationship}) — ${Number(b.share_percent)}%`,
          )
        : ["No beneficiaries named"],
    },
    {
      step: 7,
      title: "Funeral wishes",
      rows: [
        will.funeral_preference
          ? will.funeral_preference.charAt(0).toUpperCase() +
            will.funeral_preference.slice(1)
          : "No preference recorded",
        will.funeral_instructions ?? "",
      ].filter(Boolean),
    },
    {
      step: 8,
      title: "Witnesses",
      rows: will.witnesses.length
        ? will.witnesses.map((w) => `${w.full_name} — ${w.address}`)
        : ["No witnesses recorded"],
    },
  ];

  return (
    <div className="space-y-px border border-border bg-border">
      {sections
        .filter(
          (section) =>
            !(section.step === 5 && will.has_minor_children === false && false),
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
