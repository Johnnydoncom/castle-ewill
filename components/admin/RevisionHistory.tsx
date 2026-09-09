import { CheckCircle2, FileText, RotateCcw, Send } from "lucide-react";

import type { AdminWillDetail } from "@/lib/actions/admin";

type Revision = AdminWillDetail["revisions"][number];

/**
 * What has happened to this Will, in order.
 *
 * The old list printed "Revision 3" as the headline of every entry, with the
 * summary underneath and a bare date below that. Because one version carries
 * more than one event — an administrator requests changes, which is what sets
 * the new version, and the client then resubmits at that same one — it read as
 * "Revision 3, Revision 3, Revision 2, Revision 2, Revision 1", five lines all
 * dated 9 SEPT with nothing to separate them. A reviewer could not tell their
 * own note from the client's resubmission, or what order two things on one day
 * happened in. It was also keyed on `version`, which repeats, so React was
 * handed duplicate keys for rows it had to tell apart.
 *
 * The event is the headline now. The version is a small marker beside it, the
 * time is shown whenever the day alone would be ambiguous, and who did it is
 * stated — because "we asked for this" and "they sent it back" are the two
 * things a reviewer is actually scanning for.
 */
export function RevisionHistory({ revisions }: { revisions: Revision[] }) {
  if (revisions.length === 0) {
    return (
      <div className="border border-border bg-background p-6">
        <Heading />
        <p className="mt-3 text-xs italic text-muted-foreground">
          Nothing has happened to this Will yet.
        </p>
      </div>
    );
  }

  /*
   * Whether the date alone is enough.
   *
   * Five entries reading "9 SEPT 2026" tell you nothing about their order. The
   * time is added only where a day genuinely repeats, so an ordinary history
   * with one event a month is not cluttered with clock faces.
   */
  const daysSeen = revisions.map((revision) => dayOf(revision.created_at));
  const crowdedDays = new Set(
    daysSeen.filter((day, index) => daysSeen.indexOf(day) !== index),
  );

  return (
    <div className="border border-border bg-background p-6">
      <Heading />

      <ol className="mt-5">
        {revisions.map((revision, index) => {
          const kind = classify(revision.summary);
          const last = index === revisions.length - 1;

          return (
            // Keyed on the row's own id. `version` repeats.
            <li key={revision.id} className="relative flex gap-3.5 pb-5 last:pb-0">
              {/*
                The spine, drawn per item and stopped on the last one so the
                line does not dangle past the final event.
              */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute left-[11px] top-6 bottom-0 w-px bg-border"
                />
              )}

              <span
                aria-hidden
                className={`relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border bg-background ${kind.ring}`}
              >
                <kind.icon className={`h-3 w-3 ${kind.tint}`} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className={`text-sm font-medium ${kind.tint}`}>{kind.label}</p>
                  <span className="border border-border px-1.5 py-px text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    v{revision.version}
                  </span>
                </div>

                {/*
                  The note only when it says something the label does not.
                  "Submitted" under a heading reading "Submitted" is a line
                  nobody reads twice.
                */}
                {kind.detail && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {kind.detail}
                  </p>
                )}

                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  {when(revision.created_at, crowdedDays.has(dayOf(revision.created_at)))}
                  {revision.actor && (
                    <>
                      {" · "}
                      <span className={revision.actor.is_admin ? "text-gold" : undefined}>
                        {revision.actor.is_admin ? "Reviewer" : "Client"}
                        {revision.actor.name ? ` — ${revision.actor.name}` : ""}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Heading() {
  return (
    <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
      Revision history
    </p>
  );
}

/**
 * What kind of event this is, read off the summary the backend wrote.
 *
 * Matching on the text rather than on a column because that is what there is:
 * `will_revisions.summary` is free prose, written at four call sites. A `type`
 * column would be better and is a migration nobody needs today — the prefixes
 * below are stable strings in `WillReviewService` and `WillSubmissionController`,
 * and an unrecognised summary falls through to being shown verbatim rather than
 * hidden.
 */
function classify(summary: string | null): {
  label: string;
  detail: string | null;
  icon: typeof CheckCircle2;
  tint: string;
  ring: string;
} {
  const text = (summary ?? "").trim();

  if (text.startsWith("Changes requested")) {
    return {
      label: "Changes requested",
      // Everything after the colon is the reviewer's actual note, which is the
      // only part of this entry worth reading closely.
      detail: text.slice(text.indexOf(":") + 1).trim() || null,
      icon: RotateCcw,
      tint: "text-destructive",
      ring: "border-destructive/40",
    };
  }

  if (text.startsWith("Submitted")) {
    return {
      label: "Submitted",
      detail: null,
      icon: Send,
      tint: "text-navy",
      ring: "border-border",
    };
  }

  if (text.startsWith("Approved")) {
    return {
      label: "Approved",
      detail: null,
      icon: CheckCircle2,
      tint: "text-success",
      ring: "border-success/40",
    };
  }

  if (text.startsWith("Answers confirmed")) {
    return {
      label: "Answers confirmed",
      detail: "Awaiting payment.",
      icon: FileText,
      tint: "text-navy",
      ring: "border-border",
    };
  }

  return {
    label: text || "Recorded",
    detail: null,
    icon: FileText,
    tint: "text-navy",
    ring: "border-border",
  };
}

function dayOf(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function when(iso: string | null, withTime: boolean): string {
  if (!iso) return "—";

  const date = new Date(iso);

  const day = date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!withTime) return day;

  return `${day}, ${date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
