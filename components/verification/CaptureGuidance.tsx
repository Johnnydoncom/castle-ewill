/**
 * What the check will ask for, said before the camera opens.
 *
 * Two things it is worth knowing in advance, and neither is on Smile ID's own
 * screens:
 *
 *  - **The selfie step waits for a smile.** While it waits it issues framing
 *    hints — "move your device higher", "lower", "right" — which read as the
 *    thing being asked for. They are not. Somebody following them exactly can
 *    stand there indefinitely; somebody who shows their teeth is through in a
 *    second. That was reported as the check being stuck, three times, before
 *    the difference was understood.
 *  - **A document is photographed after the selfie.** Worth saying up front so
 *    the client fetches their ID before starting rather than halfway through,
 *    with a camera already open.
 *
 * We cannot edit their screens. We can say what they are looking for.
 */
export function CaptureGuidance() {
  return (
    <div className="mt-6 border border-border bg-surface px-5 py-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        Before you start
      </p>

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          <span className="text-navy">Have a government ID to hand</span> — your
          NIN slip, passport, driver&apos;s licence or voter&apos;s card. You
          will photograph it, or attach a photo you already have, after the
          selfie.
        </li>
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
