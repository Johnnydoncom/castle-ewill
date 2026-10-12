import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Account closed",
  robots: { index: false, follow: false },
};

/**
 * Where a client lands after closing their account (`CloseAccountForm`).
 *
 * Public, because by now there is no session: the API ended it in the same
 * request that closed the account. The erasure date arrives in the query
 * string from that response and is only displayed — nothing here reads or
 * trusts it, and a missing or malformed one simply leaves the date out. The
 * same date is in the confirmation email, which is the record.
 */
export default async function AccountClosedPage({
  searchParams,
}: {
  searchParams: Promise<{ erase?: string }>;
}) {
  const { erase } = await searchParams;

  const parsed = erase ? new Date(erase) : null;
  const erasureDate =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Africa/Lagos",
        })
      : null;

  return (
    <AuthShell
      eyebrow="Account closed"
      title={
        <>
          Your account is <span className="italic text-gold">closed.</span>
        </>
      }
      intro="You withdrew your consent, and we have stopped processing your personal data. We have sent a confirmation to the email address on the account."
      plateImage="/images/signing-hands.jpg"
      plateCaption="What you asked of us, done."
      footer={
        <>
          Did not ask for this?{" "}
          <Link
            href="/contact"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Contact us at once &rarr;
          </Link>
        </>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-navy/80">
        <p>
          Your account, your Will and the documents in your vault can no longer
          be reached by you or by our staff. They are held securely
          {erasureDate ? ` until ${erasureDate}` : " for six months"}, and then
          permanently erased.
        </p>
        <p>
          Changed your mind? Contact us
          {erasureDate ? ` before ${erasureDate}` : " within six months"} and
          we will send you a link to reopen your account.
        </p>
        <p>
          A paper Will you have already signed and had witnessed is not
          affected by closing your account.
        </p>
        <p>
          <Link
            href="/"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Return to the home page &rarr;
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
