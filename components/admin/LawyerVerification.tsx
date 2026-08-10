"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { useFormAction } from "@/hooks/use-api-form";
import { setLawyerVerificationAction } from "@/lib/actions/review";

function Submit({ label, tone }: { label: string; tone: "approve" | "refuse" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-xs underline underline-offset-4 transition-colors disabled:opacity-50 ${
        tone === "approve"
          ? "text-muted-foreground hover:text-success"
          : "text-muted-foreground hover:text-destructive"
      }`}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * The control that turns a claimed enrolment number into a verified one.
 *
 * Shown only for lawyer accounts. The number itself is rendered beside it —
 * an administrator cannot check the roll without seeing what they are
 * checking, and it is the reason this control exists at all.
 */
export function LawyerVerification({
  userId,
  enrolmentNumber,
  isVerified,
  rejectedReason,
}: {
  userId: string;
  enrolmentNumber: string | null;
  isVerified: boolean;
  rejectedReason: string | null;
}) {
  const [state, action] = useFormAction(setLawyerVerificationAction);
  const [refusing, setRefusing] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-navy">
          {enrolmentNumber ?? "— no number given —"}
        </span>
        <span
          className={`border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${
            isVerified
              ? "border-success/50 text-success"
              : "border-gold/60 text-gold"
          }`}
        >
          {isVerified ? "Verified" : "Unchecked"}
        </span>
      </div>

      {rejectedReason && !isVerified && (
        <p className="text-xs leading-relaxed text-destructive">
          {rejectedReason}
        </p>
      )}

      {state.status === "error" && (
        <p className="text-xs text-destructive">
          {state.fieldErrors?.reason?.[0] ?? state.message}
        </p>
      )}

      {refusing ? (
        <form action={action} className="space-y-2">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="verified" value="false" />
          <textarea
            name="reason"
            rows={2}
            required
            minLength={10}
            defaultValue={state.values?.reason ?? ""}
            placeholder="Why the number was not accepted — the applicant sees this."
            className="w-full border border-border bg-transparent p-2 text-xs text-navy placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
          />
          <div className="flex gap-4">
            <Submit label="Confirm refusal" tone="refuse" />
            <button
              type="button"
              onClick={() => setRefusing(false)}
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-4">
          {!isVerified && (
            <form action={action}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="verified" value="true" />
              <Submit label="Verify" tone="approve" />
            </form>
          )}
          <button
            type="button"
            onClick={() => setRefusing(true)}
            className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive"
          >
            {isVerified ? "Withdraw" : "Refuse"}
          </button>
        </div>
      )}
    </div>
  );
}
