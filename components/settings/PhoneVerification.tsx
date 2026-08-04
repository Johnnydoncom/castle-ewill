"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Smartphone } from "lucide-react";

import { sendPhoneCodeAction, confirmPhoneCodeAction } from "@/lib/actions/phone";
import { type FormState } from "@/lib/actions/state";

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

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

export function PhoneVerification({
  phone,
  verified,
}: {
  phone: string | null;
  verified: boolean;
}) {
  const [sendState, send] = useFormAction(sendPhoneCodeAction);
  const [confirmState, confirm] = useFormAction(confirmPhoneCodeAction);
  const [codeSent, setCodeSent] = useState(false);

  const nowVerified = verified || confirmState.status === "success";
  const awaitingCode = codeSent || sendState.status === "success";

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <Smartphone
          className={`mt-0.5 h-5 w-5 shrink-0 ${nowVerified ? "text-success" : "text-muted-foreground"}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">Phone number</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nowVerified
              ? "Your phone number is verified. We use it only for account security and to reach you about your Will."
              : "Verify a mobile number so we can reach you about your Will and confirm changes to your account."}
          </p>

          {nowVerified ? (
            <p className="mt-5 inline-flex items-center gap-2 border border-success/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-success">
              <CheckCircle2 className="h-3 w-3" />
              Verified{phone ? ` · ${phone}` : ""}
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              <form
                action={send}
                onSubmit={() => setCodeSent(true)}
                className="max-w-sm space-y-3"
              >
                <label
                  htmlFor="phone-number"
                  className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
                >
                  Mobile number
                </label>
                <input
                  id="phone-number"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  defaultValue={phone ?? ""}
                  placeholder="08111115547"
                  className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy focus:border-gold focus:outline-none"
                />
                {sendState.fieldErrors?.phone && (
                  <p className="text-xs text-destructive">
                    {sendState.fieldErrors.phone[0]}
                  </p>
                )}
                <Submit
                  label={awaitingCode ? "Resend code" : "Send code"}
                  busy="Sending…"
                />
                <Note state={sendState} />
              </form>

              {awaitingCode && (
                <form action={confirm} className="max-w-xs space-y-3 border-t border-border pt-6">
                  <label
                    htmlFor="phone-code"
                    className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
                  >
                    Enter the code
                  </label>
                  <input
                    id="phone-code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-mono text-lg tracking-[0.3em] text-navy focus:border-gold focus:outline-none"
                  />
                  {confirmState.fieldErrors?.code && (
                    <p className="text-xs text-destructive">
                      {confirmState.fieldErrors.code[0]}
                    </p>
                  )}
                  <Submit label="Verify number" busy="Verifying…" />
                  <Note state={confirmState} />
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
