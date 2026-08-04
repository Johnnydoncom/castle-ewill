"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

import {
  beginTwoFactorSetupAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
  type TwoFactorSetup,
} from "@/lib/actions/two-factor";
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

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [starting, startTransition] = useTransition();
  const [confirmState, confirm] = useFormAction(confirmTwoFactorAction);
  const [disableState, disable] = useFormAction(disableTwoFactorAction);

  const nowEnabled =
    (enabled || confirmState.status === "success") &&
    disableState.status !== "success";

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <ShieldCheck
          className={`mt-0.5 h-5 w-5 shrink-0 ${nowEnabled ? "text-success" : "text-muted-foreground"}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">
            Two-factor authentication
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nowEnabled
              ? "Your account asks for a code from your authenticator app each time you sign in."
              : "Add a second step to sign-in using an authenticator app such as Google Authenticator, Authy or 1Password."}
          </p>

          {nowEnabled ? (
            <div className="mt-6 space-y-4">
              <span className="inline-block border border-success/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-success">
                Switched on
              </span>

              <form action={disable} className="max-w-sm space-y-3">
                <label
                  htmlFor="disable-password"
                  className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
                >
                  Confirm your password to switch it off
                </label>
                <input
                  id="disable-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy focus:border-gold focus:outline-none"
                />
                {disableState.fieldErrors?.password && (
                  <p className="text-xs text-destructive">
                    {disableState.fieldErrors.password[0]}
                  </p>
                )}
                <Submit label="Switch off" busy="Switching off…" />
                <Note state={disableState} />
              </form>
            </div>
          ) : setup && setup.status === "success" ? (
            <div className="mt-6 space-y-5">
              <div className="border border-border bg-surface p-5">
                <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-gold">
                  Setup key
                </p>
                <p className="mt-3 break-all font-mono text-sm tracking-wider text-navy">
                  {setup.formatted}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  In your authenticator app choose &ldquo;enter a setup key
                  manually&rdquo; and paste the value above. We do not render a
                  QR code, because generating one would mean sending your secret
                  to a third-party image service.
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-navy underline underline-offset-4">
                    Show the otpauth link
                  </summary>
                  <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
                    {setup.uri}
                  </p>
                </details>
              </div>

              <form action={confirm} className="max-w-xs space-y-3">
                <label
                  htmlFor="totp-confirm"
                  className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
                >
                  Enter the current code
                </label>
                <input
                  id="totp-confirm"
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
                <Submit label="Confirm and switch on" busy="Verifying…" />
                <Note state={confirmState} />
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={starting}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      setSetup(
                        await beginTwoFactorSetupAction(),
                      );
                    } catch {
                      setSetup({
                        status: "error",
                        message:
                          "We could not start the setup just now. Please try again.",
                      });
                    }
                  })
                }
                className="flex h-11 items-center justify-center border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
              >
                {starting ? "Preparing…" : "Set up two-factor"}
              </button>
              {setup && setup.status === "error" && (
                <p className="flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {setup.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
