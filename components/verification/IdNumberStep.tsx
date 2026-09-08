"use client";

import { useState } from "react";

export type IdTypeOption = { type: string; label: string; regex: string };

/**
 * Which ID, and its number — the one screen in this flow that is ours.
 *
 * Biometric KYC matches a selfie against the record the **issuing authority**
 * holds for a number, so the number is the whole input and there is no
 * document to photograph. Eleven digits typed off a card beats a photograph of
 * that card taken in whatever light somebody happens to be standing in.
 *
 * Smile ID publish no element for this, which is the point of building the
 * flow from components rather than taking the hosted modal: their ID screen
 * lists every type their catalogue has, and this one lists only the types this
 * account may actually ask about.
 *
 * The number is checked against their own regex for the type before it goes
 * anywhere. A number in the wrong shape is a request that can only fail, and
 * failing it here gives the client something to correct instead of a vendor
 * error code arriving after a camera.
 */
export function IdNumberStep({
  types,
  onChosen,
}: {
  types: IdTypeOption[];
  onChosen: (idType: string, idNumber: string) => void;
}) {
  const [idType, setIdType] = useState(types[0]?.type ?? "");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chosen = types.find((type) => type.type === idType) ?? types[0] ?? null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!chosen) return;

    const value = idNumber.trim();

    if (!new RegExp(chosen.regex).test(value)) {
      setError(`That does not look like a ${chosen.label}. Check it and try again.`);

      return;
    }

    setError(null);
    onChosen(chosen.type, value);
  };

  return (
    <form onSubmit={submit} className="mt-2 space-y-4 text-left" noValidate>
      <p className="text-center text-sm text-muted-foreground">
        We check this against the authority that issued it, then match your face
        to their record. Nothing is uploaded.
      </p>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Which ID
        </span>
        <select
          value={idType}
          onChange={(event) => {
            setIdType(event.target.value);
            setError(null);
          }}
          className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
        >
          {types.map((type) => (
            <option key={type.type} value={type.type}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Number
        </span>
        <input
          value={idNumber}
          onChange={(event) => {
            setIdNumber(event.target.value);
            setError(null);
          }}
          // Their regexes are anchored, so a leading `^[0-9]` is a reliable
          // signal that this is a digits-only field worth a numeric keypad.
          inputMode={/^\^\[0-9\]/.test(chosen?.regex ?? "") ? "numeric" : "text"}
          autoComplete="off"
          required
          className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
        />
      </label>

      {error && (
        <p role="status" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
      >
        Continue to the camera
      </button>
    </form>
  );
}

/**
 * What the camera step actually wants, said before it opens.
 *
 * Their default capture is gated on a **smile**, and says so nowhere: while it
 * waits for one it issues framing hints — "move your device higher", "lower",
 * "right" — which read as the thing being asked for. They are not. Somebody
 * following them exactly can stand there indefinitely; somebody who shows
 * their teeth is through in a second. That was reported as the check being
 * stuck, three times, before the difference was understood.
 *
 * We cannot edit their screen. We can say what it is looking for beforehand.
 */
export function CaptureGuidance() {
  return (
    <div className="mt-6 border border-border bg-surface px-5 py-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        Before the camera opens
      </p>

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          <span className="text-navy">Fill the oval.</span> Your face needs to
          take up most of it — closer than feels natural on a laptop, about an
          arm&apos;s length on a phone.
        </li>
        <li>
          <span className="text-navy">Then smile, showing your teeth.</span> That
          is what the camera is waiting for — it is how it tells a live person
          from a photograph, and the check moves on the moment it sees one. It
          will keep suggesting you move the device until then.
        </li>
        <li>
          <span className="text-navy">Face a window or a lamp,</span> not away
          from one, and take off a hat or sunglasses.
        </li>
      </ul>
    </div>
  );
}
