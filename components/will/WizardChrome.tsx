"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

import type { FormState } from "@/lib/actions/state";
import type { WillStepDefinition } from "@/lib/will/steps";

/** Segmented progress bar across the applicable steps. */
export function StepProgress({
  steps,
  current,
  completed,
}: {
  steps: readonly WillStepDefinition[];
  current: number;
  completed: number[];
}) {
  const done = new Set(completed);

  return (
    <nav aria-label="Progress" className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <ol className="flex items-start gap-1.5">
          {steps.map((step) => {
            const isDone = done.has(step.step);
            const isCurrent = step.step === current;

            return (
              <li key={step.slug} className="flex-1">
                <div
                  className={`h-1 rounded-full transition-colors ${isCurrent ? "bg-gold" : isDone ? "bg-navy" : "bg-border"
                    }`}
                />
                <p
                  className={`mt-2 hidden max-w-[250px] text-[10px] uppercase tracking-[0.18em] sm:block ${isCurrent
                    ? "text-gold"
                    : isDone
                      ? "text-navy"
                      : "text-muted-foreground/60"
                    }`}
                >
                  {step.title}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:hidden">
          Step {current} of {steps.length}
        </p>
      </div>
    </nav>
  );
}

export function StepHeading({ step }: { step: WillStepDefinition }) {
  return (
    <header className="border-b border-border pb-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-10 shrink-0 bg-gold" />
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          {step.numeral} &middot; {step.eyebrow}
        </p>
      </div>
      <h1 className="font-serif text-3xl tracking-tight text-navy sm:text-4xl">
        {step.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {step.intro}
      </p>
    </header>
  );
}

/** Marginal note carrying the plain-English explanation for the step. */
export function HelpPanel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="border-l-2 border-gold/40 bg-gold/5 px-5 py-4">
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
        Why this matters
      </p>
      <p className="mt-2 text-sm leading-relaxed text-navy/80">{children}</p>
    </aside>
  );
}

export function StepBanner({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;

  return (
    <div
      role="alert"
      className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy"
    >
      {state.message}
    </div>
  );
}

export function WizardFooter({
  backHref,
  label = "Save & continue",
}: {
  backHref?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
      <div className="flex items-center gap-6">
        {backHref && (
          <Link
            href={backHref}
            className="text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
          >
            &larr; Back
          </Link>
        )}
        <Link
          href="/dashboard"
          className="text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
        >
          Save &amp; exit
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 items-center gap-3 bg-navy px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground"
          />
        )}
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}

export function CompletionPill({ percent }: { percent: number }) {
  return (
    <span className="inline-flex items-center gap-2 border border-border px-3 py-1 font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
      {percent === 100 && <Check className="h-3 w-3 text-success" />}
      {percent}% complete
    </span>
  );
}
