import Link from "next/link";

import type { ApiWill, WillPerson } from "@/lib/actions/will";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import {
  sectionBySlug,
  stepByNumber,
  type WillSectionSlug,
} from "@/lib/will/steps";

/**
 * Read-only summary of every section, with an edit link to the page each is
 * answered on.
 *
 * The "Incomplete" marks come from `will.progress`, computed by the API using
 * the same rules that gate submission — so a section shown as complete here is
 * one the server agrees is complete.
 */
export function ReviewSummary({
  will,
  /*
   * Where an Edit link should go. Defaults to the entry route, which resolves
   * the Will in flight — but a caller that already knows which Will this is
   * passes its own editor path, so the link cannot land on a different one.
   */
  editBasePath = "/dashboard/will",
}: {
  will: ApiWill;
  editBasePath?: string;
}) {
  const verdicts = new Map<string, boolean>(
    (will.progress?.steps ?? []).flatMap((step) =>
      (step.sections ?? []).map((section) => [section.slug, section.complete] as const),
    ),
  );

  const guardianOf = (beneficiary: WillPerson) =>
    will.guardians.find((g) => g.beneficiary_id === beneficiary.id);

  // Appointed before guardians were tied to a beneficiary.
  const unattachedGuardians = will.guardians.filter((g) => !g.beneficiary_id);

  const sections: Array<{ slug: WillSectionSlug; rows: string[] }> = [
    {
      slug: "personal",
      rows: [
        will.personal.full_legal_name ?? "—",
        will.personal.date_of_birth ? `Born ${will.personal.date_of_birth}` : "Date of birth missing",
        will.personal.national_id ? `NIN ${will.personal.national_id}` : "National Identification Number missing",
        [will.personal.address_line1, will.personal.city, will.personal.state].filter(Boolean).join(", ") ||
          "Address missing",
      ],
    },
    {
      slug: "declaration",
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
      slug: "executors",
      rows: will.executors.length
        ? will.executors.map(
            (e) =>
              `${e.full_name}${e.is_alternate ? " (alternate)" : ""} — ${[e.email, e.phone].filter(Boolean).join(", ") || "no contact details"}`,
          )
        : ["No executors appointed"],
    },
    {
      slug: "beneficiaries",
      rows: will.beneficiaries.length
        ? [
            ...will.beneficiaries.map((b) => {
              const guardian = guardianOf(b);

              return `${b.full_name} (${b.relationship})${
                b.is_minor
                  ? ` — under 18, guardian ${guardian?.full_name ?? "not yet appointed"}`
                  : ""
              }`;
            }),
            ...unattachedGuardians.map(
              (g) => `Guardian ${g.full_name}${g.children_covered ? ` for ${g.children_covered}` : ""}`,
            ),
          ]
        : ["No beneficiaries named"],
    },
    {
      slug: "trustees",
      rows:
        will.executors_are_trustees === null
          ? ["Not yet answered"]
          : [
              will.executors_are_trustees
                ? "My executors act as my trustees"
                : (will.trustees ?? [])
                    .map((t) => `${t.full_name} — ${t.address}`)
                    .join("; ") || "No trustees named",
              ...(will.trust_bank_account
                ? ["A trust bank account is to be opened"]
                : []),
              ...(will.distribution_frequency
                ? [`Beneficiaries paid ${will.distribution_frequency.replace("_", "-")}`]
                : []),
            ],
    },
    {
      slug: "assets",
      rows: will.assets.length
        ? will.assets.map(
            (a) =>
              `${a.description ?? "Unnamed asset"}${a.institution ? ` — ${a.institution}` : ""}`,
          )
        : will.assets_declared_none
          ? ["Nothing listed separately"]
          : ["Not yet answered"],
    },
    {
      slug: "bequests",
      rows: will.bequests.length
        ? will.bequests.map(
            (b) => `${b.item_description} → ${b.recipient_name}`,
          )
        : will.estate_in_trust
          ? ["The whole estate is left to the trustees to hold and manage"]
          : ["Not yet answered"],
    },
    {
      slug: "residue",
      rows: will.beneficiaries.length
        ? [
            ...will.beneficiaries.map(
              (b) =>
                `${b.full_name} — ${
                  b.share_percent === null || b.share_percent === undefined
                    ? "share not yet set"
                    : `${Number(b.share_percent)}%`
                }${b.is_contingent ? " (contingent)" : ""}`,
            ),
            ...(will.residuary_estate ? [will.residuary_estate] : []),
          ]
        : ["No beneficiaries to share the residue between"],
    },
    {
      slug: "funeral",
      rows: [
        will.funeral_preference
          ? will.funeral_preference.charAt(0).toUpperCase() +
            will.funeral_preference.slice(1)
          : "No preference recorded",
        will.funeral_instructions ?? "",
      ].filter(Boolean),
    },
    {
      slug: "witnesses",
      rows: will.witnesses.length
        ? will.witnesses.map((w) => `${w.full_name} — ${w.address}`)
        : ["No witnesses recorded"],
    },
  ];

  return (
    <div className="space-y-px border border-border bg-border">
      {sections.map(({ slug, rows }) => {
        const section = sectionBySlug(slug);

        return (
          <section key={slug} className="bg-background p-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                  {stepByNumber(section.step)?.numeral}
                </span>
                <h3 className="font-serif text-lg text-navy">{section.title}</h3>
                {verdicts.get(slug) === false && (
                  <span className="border border-destructive/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                    Incomplete
                  </span>
                )}
              </div>
              <Link
                href={`${editBasePath}?step=${section.step}`}
                className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
              >
                Edit
              </Link>
            </div>
            <ul className="space-y-1.5 pl-8">
              {rows.map((row, i) => (
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
