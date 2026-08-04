"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { useFormStatus } from "react-dom";
import { AlertCircle, CalendarClock, CheckCircle2 } from "lucide-react";

import { recordLifeEventAction } from "@/lib/actions/will.client";
import { type FormState } from "@/lib/actions/state";

const EVENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "marriage", label: "I got married" },
  { value: "birth_of_child", label: "I had a child" },
  { value: "property_acquisition", label: "I acquired property" },
];

function Note({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  const Icon = ok ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      className={`flex items-start gap-2 text-xs leading-relaxed ${ok ? "text-success" : "text-destructive"}`}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {state.message}
    </p>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending…" : "Tell us and get a reminder"}
    </button>
  );
}

/**
 * Life circumstances change faster than a calendar does. This lets a client
 * flag a marriage, a birth or a property acquisition and get an immediate
 * prompt to review their Will, rather than waiting for the annual reminder.
 */
export function LifeEventForm({ willId }: { willId: string }) {
  const [state, action] = useFormAction(recordLifeEventAction, { refresh: false });

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">
            Something changed since you last reviewed your Will?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A marriage, a new child, or a property acquisition is a good reason
            to revisit your Will sooner than the yearly reminder. Tell us and
            we&apos;ll prompt you straight away.
          </p>

          <form action={action} className="mt-6 max-w-sm space-y-4">
            <input type="hidden" name="willId" value={willId} />

            <div className="space-y-2">
              <label
                htmlFor="life-event-type"
                className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
              >
                What happened
              </label>
              <select
                id="life-event-type"
                name="eventType"
                required
                defaultValue=""
                className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
              >
                <option value="" disabled>
                  Choose one
                </option>
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.eventType && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.eventType[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="life-event-note"
                className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
              >
                Anything you&apos;d like to add (optional)
              </label>
              <textarea
                id="life-event-note"
                name="note"
                rows={2}
                maxLength={512}
                className="w-full resize-none border border-border bg-transparent px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
              />
            </div>

            <Submit />
            <Note state={state} />
          </form>
        </div>
      </div>
    </section>
  );
}
