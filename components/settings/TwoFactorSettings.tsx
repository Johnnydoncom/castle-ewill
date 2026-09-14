"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, CheckCircle2, Copy, ShieldCheck } from "lucide-react";

import {
  beginTwoFactorSetupAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
  type TwoFactorSetup,
} from "@/lib/actions/two-factor";
import { type FormState } from "@/lib/actions/state";
import { COMPANY } from "@/lib/company";

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

/** What the client does with the code, in the order they do it. */
const STEPS = [
  {
    title: "Open your authenticator app",
    body: "Google Authenticator, Microsoft Authenticator, Authy or 1Password all work.",
  },
  {
    title: "Scan the QR code",
    body: "Tap “Add account” or the + button, then point your camera at the code.",
  },
  {
    title: "Enter the 6-digit code",
    body: `Type the code your app now shows for ${COMPANY.name} to switch two-factor on.`,
  },
] as const;

/**
 * Two-factor authentication: switching it on, and off.
 *
 * Setting it up is a QR code to scan (2026-09-14). The code is drawn by our
 * own API and arrives inside the response as an image, so the secret is never
 * sent to an image service. The key stays available behind "Can't scan the
 * code?" for an app — or a device without a camera — that needs it typed.
 */
export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [starting, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [confirmState, confirm] = useFormAction(confirmTwoFactorAction);
  const [disableState, disable] = useFormAction(disableTwoFactorAction);

  const nowEnabled =
    (enabled || confirmState.status === "success") &&
    disableState.status !== "success";

  async function copyKey(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission: the key is on screen to select by hand.
      setCopied(false);
    }
  }

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
            <div className="mt-6 border border-border">
              <div className="grid gap-8 bg-surface p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <div className="flex flex-col items-center gap-3">
                  {setup.qr ? (
                    <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element -- an inline data URI from our own API: nothing to fetch or optimise */}
                      <img
                        src={setup.qr}
                        alt={`QR code to add ${COMPANY.name} to your authenticator app`}
                        width={200}
                        height={200}
                        className="h-[200px] w-[200px] [image-rendering:pixelated]"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[226px] w-[226px] items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center text-xs leading-relaxed text-muted-foreground">
                      The QR code could not be shown. Use the setup key below
                      instead.
                    </div>
                  )}
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Scan with your app
                  </p>
                </div>

                <ol className="space-y-5">
                  {STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy font-serif text-xs text-navy-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <details
                open={!setup.qr}
                className="border-t border-border bg-background px-6 py-4 sm:px-8"
              >
                <summary className="cursor-pointer text-xs text-navy underline underline-offset-4">
                  Can&apos;t scan the code? Enter a setup key instead
                </summary>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="break-all font-mono text-sm tracking-wider text-navy">
                    {setup.formatted}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyKey(setup.secret)}
                    className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy key"}
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  In your app, choose &ldquo;Enter a setup key&rdquo;, name the
                  account {COMPANY.name}, and choose a time-based key.
                </p>
              </details>

              <form
                action={confirm}
                className="flex flex-wrap items-end gap-4 border-t border-border bg-background px-6 py-6 sm:px-8"
              >
                <label htmlFor="totp-confirm" className="min-w-0 flex-1 basis-56">
                  <span className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
                    6-digit code from your app
                  </span>
                  <input
                    id="totp-confirm"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    required
                    className="mt-2 w-full max-w-xs border-0 border-b border-border bg-transparent px-0 py-2.5 font-mono text-2xl tracking-[0.35em] text-navy placeholder:text-muted-foreground/40 focus:border-gold focus:outline-none"
                  />
                </label>
                <Submit label="Confirm and switch on" busy="Verifying…" />
                <div className="basis-full space-y-1">
                  {confirmState.fieldErrors?.code && (
                    <p className="text-xs text-destructive">
                      {confirmState.fieldErrors.code[0]}
                    </p>
                  )}
                  <Note state={confirmState} />
                </div>
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
                      setSetup(await beginTwoFactorSetupAction());
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
