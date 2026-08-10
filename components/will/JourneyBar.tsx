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

/** Stages the platform cannot observe on its own. */
const MANUAL: ReadonlySet<JourneyStage> = new Set(["execute", "lodge"]);

/**
 * The seven-stage progress rail.
 *
 * Rendered from `journey.stage`, which the server derives — never recomputed
 * here. The stage depends on payments, identity checks and a subscription, and
 * a bar that worked that out for itself would eventually disagree with the
 * server about what the client is allowed to do next. Disagreeing about *that*
 * is how someone ends up staring at a "Print" step beside a download that
 * returns 402.
 *
 * Legal review is marked optional on its face because it is skippable in one
 * click; a rail that presented it as a checkpoint would contradict the whole
 * proposition of the platform.
 */
export function JourneyBar({ journey }: { journey: WillJourney }) {
  const currentIndex = JOURNEY_STAGES.indexOf(journey.stage);

  return (
    <nav aria-label="Your progress" className="border border-border bg-background">
      <ol className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-7">
        {JOURNEY_STAGES.map((stage, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={stage}
              aria-current={isCurrent ? "step" : undefined}
              className={`bg-background px-4 py-4 ${
                isCurrent ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isDone
                      ? "bg-success/15 text-success"
                      : isCurrent
                        ? "bg-gold text-navy"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span
                  className={`truncate text-xs font-medium ${
                    isCurrent
                      ? "text-navy"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                  }`}
                >
                  {LABELS[stage]}
                </span>
              </div>

              {stage === "legal_review" && (
                <span className="mt-1.5 block pl-7 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  Optional
                </span>
              )}
              {MANUAL.has(stage) && (
                <span className="mt-1.5 block pl-7 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  With you
                </span>
              )}
              {(stage === "protect" || stage === "update") && (
                <span className="mt-1.5 block pl-7 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  Subscribers
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
