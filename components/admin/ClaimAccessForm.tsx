"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";

import { claimWillAccess } from "@/lib/actions/will-access.client";

/**
 * Where a member of staff enters the code a client read to them.
 *
 * The code opens this Will to whoever enters it, and to nobody else; it works
 * once, and five wrong entries void it. The client is emailed as soon as it
 * is used. On success the page reloads its data — the contents arrive from
 * the server, never from this form.
 */
export function ClaimAccessForm({ willId }: { willId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function claim() {
    setError(null);

    startTransition(async () => {
      const result = await claimWillAccess(willId, code);

      if (!result.ok) {
        setError(result.message);

        return;
      }

      setCode("");
      router.refresh();
    });
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        claim();
      }}
    >
      <label
        htmlFor="access-code"
        className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
      >
        Client&apos;s access code
      </label>
      <input
        id="access-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder="ABCD-EFGH"
        maxLength={16}
        className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase tracking-[0.2em] text-navy focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || code.trim().length < 8}
        className="inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <KeyRound className="h-3.5 w-3.5" />
        {pending ? "Checking…" : "Open with code"}
      </button>
      {error && (
        <p role="alert" className="text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The client issues the code from their Will&apos;s page. It works once, for
        you alone, and they are emailed when you use it.
      </p>
    </form>
  );
}
