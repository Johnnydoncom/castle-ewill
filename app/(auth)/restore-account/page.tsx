import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { RestoreAccountForm } from "@/components/auth/RestoreAccountForm";

export const metadata: Metadata = {
  title: "Reopen your account",
  robots: { index: false, follow: false },
};

/**
 * Where the reopen link in `AccountRestoreMail` lands.
 *
 * Renders the same however often it is fetched; the token is spent only by
 * pressing the button (`RestoreAccountForm`).
 */
export default async function RestoreAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      eyebrow="Reopen your account"
      title={
        <>
          Welcome <span className="italic text-gold">back.</span>
        </>
      }
      intro={
        token
          ? "You asked us to reopen the account you closed. Press the button below to reopen it."
          : "This link is incomplete. Open it again from the email we sent you, or contact us for another."
      }
      plateImage="/images/signing-hands.jpg"
      plateCaption="Your Will is held exactly as you left it."
      footer={
        <>
          Did not ask for this? Ignore the email and your account stays closed.{" "}
          <Link
            href="/contact"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Contact us &rarr;
          </Link>
        </>
      }
    >
      {token ? <RestoreAccountForm token={token} /> : null}
    </AuthShell>
  );
}
