/**
 * What the check will ask for, said before the camera opens.
 *
 * Two things worth knowing in advance, and neither is on Smile ID's own
 * screens:
 *
 *  - **The selfie step waits for a smile.** While it waits it issues framing
 *    hints — "move closer", "centre your face" — which read as the thing being
 *    asked for. They are not. Somebody following them exactly can stand there
 *    indefinitely; somebody who shows their teeth is through in a second.
 *  - **A first check asks for the NIN** before the camera opens, so the client
 *    has it to hand rather than going to look for it halfway through.
 *
 * We cannot edit their screens. We can say what they are looking for.
 *
 * `withDocument` is false for a client who has already been proved: their
 * check is a selfie and nothing else, and telling somebody to fetch a passport
 * they will never be asked for is worse than saying nothing — they go and get
 * it, and then distrust the rest of the list.
 */
export function CaptureGuidance({
  withDocument = true,
  withIdNumber = false,
}: {
  withDocument?: boolean;
  /** A first check: the NIN the selfie is matched against, asked for first. */
  withIdNumber?: boolean;
}) {
  return (
    <div className="border border-border bg-surface px-5 py-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        Before you start
      </p>

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {withIdNumber && (
          <li>
            <span className="text-navy">Have your NIN to hand</span> — the
            11-digit number on your NIN slip or in the NIMC app. Your selfie is
            matched against the photograph held on the national register for it.
          </li>
        )}
        {withDocument && (
          <li>
            <span className="text-navy">Have a government ID to hand</span> —
            your NIN slip, passport, driver&apos;s licence or voter&apos;s card.
            After your selfie you will photograph it, or attach a photo you
            already have.
          </li>
        )}
        <li>
          <span className="text-navy">Fill the frame.</span> Your face needs to
          take up most of it — closer than feels natural on a laptop, about an
          arm&apos;s length on a phone.
        </li>
        <li>
          <span className="text-navy">Smile, showing your teeth, when asked.</span>{" "}
          That is how the camera tells a live person from a photograph, and the
          check moves on the moment it sees one.
        </li>
        <li>
          <span className="text-navy">Face a window or a lamp,</span> not away
          from one, and take off a hat or sunglasses.
        </li>
      </ul>
    </div>
  );
}
