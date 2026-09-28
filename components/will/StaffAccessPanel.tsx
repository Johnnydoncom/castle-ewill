"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import { grantSupportAccess, withdrawAccess } from "@/lib/actions/will-access.client";
import {
  ACCESS_DURATIONS,
  ACCESS_SCOPES,
  GRANT_STATE_LABELS,
  describeAccessEvent,
  staffLabel,
  type WillAccessOverview,
  type WillAccessScope,
} from "@/lib/will/access";

/** A moment as the client reads it, the same on the server and in the browser. */
function readableMoment(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

const HISTORY_SHOWN = 8;

/**
 * Who at Castle may read this Will, who has, and the switch to stop them.
 *
 * Staff see only that a Will exists and where it stands. What it says, and a
 * copy of it, are opened by the client: here, with a one-time code they read
 * to the member of staff helping them, or by asking for a legal review. Every
 * grant can be withdrawn at once, and every use of one is listed below it.
 *
 * Inline, not a modal: the code replaces the form in place, with a way back.
 */
export function StaffAccessPanel({
  willId,
  access,
}: {
  willId: string;
  access: WillAccessOverview;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [issuing, setIssuing] = useState(false);
  const [scope, setScope] = useState<WillAccessScope>("view");
  const [hours, setHours] = useState<number>(ACCESS_DURATIONS[0].hours);
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const current = access.grants.filter(
    (grant) => grant.state === "active" || grant.state === "awaiting_code",
  );

  const history = showAll ? access.history : access.history.slice(0, HISTORY_SHOWN);

  function issue() {
    setError(null);

    startTransition(async () => {
      const result = await grantSupportAccess(willId, { scope, durationHours: hours, consent });

      if (!result.ok) {
        setError(result.fieldErrors?.consent?.[0] ?? result.message);

        return;
      }

      setCode(result.data.code);
      setIssuing(false);
      setConsent(false);
      router.refresh();
    });
  }

  function withdraw(grantId: string) {
    setError(null);

    startTransition(async () => {
      const result = await withdrawAccess(willId, grantId);

      if (!result.ok) {
        setError(result.message);

        return;
      }

      setCode(null);
      router.refresh();
    });
  }

  async function copy() {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The code is on screen to read out; copying is a convenience.
    }
  }

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-gold" />
        <div>
          <h2 className="font-serif text-xl text-navy">Castle staff access</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Our staff can see that this Will exists and where it stands, but not what
            it says, and they cannot download it, unless you allow it. If you ask us
            for help with it, give the member of staff an access code. They can use it
            once, it lasts only as long as you choose, and you can withdraw it at any
            time.
          </p>
        </div>
      </div>

      {current.length > 0 && (
        <ul className="mt-6 divide-y divide-border border border-border">
          {current.map((grant) => (
            <li
              key={grant.id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 text-sm">
                <p className="text-navy">
                  {staffLabel(grant.purpose)} ·{" "}
                  {grant.scope === "view_download" ? "read and download" : "read only"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {GRANT_STATE_LABELS[grant.state]}
                  {grant.purpose === "legal_review"
                    ? " · until the review is finished"
                    : grant.state === "awaiting_code"
                      ? ` · the code works until ${readableMoment(grant.claim_expires_at)}`
                      : ` · until ${readableMoment(grant.expires_at)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => withdraw(grant.id)}
                disabled={pending}
                className="inline-flex h-9 items-center border border-destructive/40 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Withdraw
              </button>
            </li>
          ))}
        </ul>
      )}

      {code && (
        <div className="mt-6 border-l-2 border-gold bg-gold/5 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Your access code
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="font-mono text-2xl tracking-[0.2em] text-navy">{code}</span>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Read this to the member of Castle staff helping you. It works once, within
            30 minutes. We will not show it again. We will email you when it is used.
          </p>
          <button
            type="button"
            onClick={() => setCode(null)}
            className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
          >
            Done
          </button>
        </div>
      )}

      {!code && !issuing && (
        <button
          type="button"
          onClick={() => setIssuing(true)}
          className="mt-6 inline-flex h-11 items-center border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Give Castle support access
        </button>
      )}

      {issuing && (
        <form
          className="mt-6 space-y-5 border border-border bg-surface p-5"
          onSubmit={(event) => {
            event.preventDefault();
            issue();
          }}
        >
          <fieldset>
            <legend className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              What they may do
            </legend>
            <div className="mt-2 space-y-2">
              {ACCESS_SCOPES.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className="mt-1 accent-navy"
                  />
                  <span>
                    <span className="text-navy">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              For how long
            </span>
            <select
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="mt-2 block h-10 w-full max-w-xs border border-border bg-background px-3 text-sm text-navy focus:border-gold focus:outline-none"
            >
              {ACCESS_DURATIONS.map((duration) => (
                <option key={duration.hours} value={duration.hours}>
                  {duration.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-navy">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 accent-navy"
            />
            <span>
              I allow the member of Castle staff I give this code to{" "}
              {scope === "view_download" ? "to read and download" : "to read"} this Will
              for the time I have chosen.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || !consent}
              className="inline-flex h-11 items-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Issuing…" : "Issue access code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIssuing(false);
                setError(null);
              }}
              className="h-11 px-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Access history
        </h3>
        {access.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No one at Castle has accessed this Will.
          </p>
        ) : (
          <>
            <ol className="mt-3 space-y-2">
              {history.map((event) => (
                <li key={event.id} className="flex flex-wrap gap-x-4 text-sm">
                  <span className="w-44 shrink-0 text-xs text-muted-foreground">
                    {readableMoment(event.at)}
                  </span>
                  <span className="text-navy">{describeAccessEvent(event)}</span>
                </li>
              ))}
            </ol>
            {access.history.length > HISTORY_SHOWN && (
              <button
                type="button"
                onClick={() => setShowAll((all) => !all)}
                className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
              >
                {showAll ? "Show fewer" : `Show all ${access.history.length}`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
