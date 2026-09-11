"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { setSmileIdVersionAction } from "@/lib/actions/review";
import type { SmileIdVersion } from "@/lib/smile-id/legacy";

const OPTIONS: { value: SmileIdVersion; label: string; hint: string }[] = [
  {
    value: "v3",
    label: "Current (V3)",
    hint: "Smile ID's v12 web components. The browser submits each capture to the V3 API directly, and no image reaches this platform's servers.",
  },
  {
    value: "legacy",
    label: "Legacy (JavaScript SDK v11)",
    hint: "Smile ID's older integration. Their v11 SDK captures in the browser, and our server submits the images to the v1 API with their PHP library.",
  },
];

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

/**
 * Which generation of Smile ID's integration runs.
 *
 * Its own form beside the vendor choice rather than a field inside it: the
 * vendor decides *whether* Smile ID is asked, and this decides *how*. A switch
 * applies to the next check anybody starts; a check already with Smile ID
 * finishes the way it was submitted. See `Setting::smileIdVersion()`.
 */
export function SmileIdVersionForm({ current }: { current: SmileIdVersion }) {
  const [state, action] = useFormAction(setSmileIdVersionAction);

  return (
    <form action={action} className="space-y-5">
      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${
            state.status === "success" ? "text-success" : "text-destructive"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          >
            <input
              type="radio"
              name="version"
              value={option.value}
              defaultChecked={option.value === current}
              className="mt-1 accent-gold"
            />
            <span>
              <span className="block font-serif text-base text-navy">
                {option.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Submit />
    </form>
  );
}
