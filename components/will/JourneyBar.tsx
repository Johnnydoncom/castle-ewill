import { Check } from "lucide-react";

import {
  JOURNEY_STAGES,
  type JourneyStage,
  type WillJourney,
} from "@/lib/actions/will";

const LABELS: Record<JourneyStage, string> = {
  prepare: "Prepare",
  legal_review: "Legal review",
  print: "Print",
  execute: "Execute",
  lodge: "Lodge",
  protect: "Protect",
  update: "Update",
};

/**
 * A word about each stage, shown only for the one you are on.
 *
 * These used to sit under every cell at once. Seven qualifiers competing for a
 * 768px container is what pushed the labels into "Prep…", "Lega…", "Exec…" —
 * a progress bar that cannot say the name of the step you are on is not doing
 * its one job. Only the current stage needs its terms explained; the rest are
 * either behind you or too far ahead to matter.
 */
const NOTES: Partial<Record<JourneyStage, string>> = {
  prepare: "Answer the four steps. Nothing to pay yet.",
  legal_review: "Optional — request a solicitor's read, or skip it in one click.",
  print: "Pay, confirm your identity once, then download the finished Will.",
  execute: "Yours to do: sign it in front of two witnesses.",
  lodge: "Yours to do: lodge it with the Probate Registry, if you have asked us to.",
  protect: "Held encrypted, released only to the executors you named.",
  update: "Amend and re-issue whenever life changes, while your subscription runs.",
};

/**
 * The seven-stage progress rail.
 *
 * Rendered from `journey.stage`, which the server derives — never recomputed
 * here. The stage depends on payments, identity checks and a subscription, and
 * a bar that worked that out for itself would eventually disagree with the
 * server about what the client may do next. Disagreeing about *that* is how
 * someone ends up staring at a "Print" step beside a download that returns 402.
 *
 * A connected rail rather than a grid of bordered cells: seven equal columns in
 * the wizard's 768px container gave each stage about 90px, which truncated
 * every label longer than "Print". Nodes carry the number, the name sits under
 * them and is allowed to wrap to two lines, and nothing is abbreviated.
 */
export function JourneyBar({ journey }: { journey: WillJourney }) {
  const currentIndex = JOURNEY_STAGES.indexOf(journey.stage);
  const note = NOTES[journey.stage];

  return (
    <nav aria-label="Your progress" className="border border-border bg-background p-5 sm:p-6">
      <ol className="flex items-start">
        {JOURNEY_STAGES.map((stage, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={stage}
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-1 flex-col items-center"
            >
              {/* Node, with the rail passing through it. The connectors are
                  drawn as siblings so they meet the node's edges rather than
                  running underneath it. */}
              <div className="flex w-full items-center">
                <span
                  aria-hidden
                  className={`h-px flex-1 ${
                    index === 0
                      ? "bg-transparent"
                      : isDone || isCurrent
                        ? "bg-gold/60"
                        : "bg-border"
                  }`}
                />
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                    isDone
                      ? "bg-success/15 text-success"
                      : isCurrent
                        ? "bg-gold text-navy"
                        : "border border-border bg-background text-muted-foreground/70"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  aria-hidden
                  className={`h-px flex-1 ${
                    index === JOURNEY_STAGES.length - 1
                      ? "bg-transparent"
                      : isDone
                        ? "bg-gold/60"
                        : "bg-border"
                  }`}
                />
              </div>

              {/* Allowed to wrap. Never truncated — the name of the step is
                  the whole point of the component. */}
              <span
                className={`mt-2 px-1 text-center text-[11px] leading-tight ${
                  isCurrent
                    ? "font-semibold text-navy"
                    : isDone
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                }`}
              >
                {LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>

      {note && (
        <p className="mt-5 border-t border-border pt-4 text-center text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-navy">{LABELS[journey.stage]}</span>
          {" — "}
          {note}
        </p>
      )}
    </nav>
  );
}
