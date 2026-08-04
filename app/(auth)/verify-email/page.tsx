import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { ConfirmEmailForm } from "@/components/auth/ConfirmEmailForm";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  /*
   * The token is deliberately NOT consumed here. This is a plain GET, and
   * mail gateways/clients routinely prefetch every link in an email to scan
   * it before a person ever opens it — a page that verified on render would
   * have its single-use token burned by that scan, and the real click a
   * moment later would see "already used", indistinguishable from having
   * expired instantly. Consumption happens only inside `ConfirmEmailForm`,
   * gated behind an explicit button, which a passive GET never triggers.
   */

  return (
    <AuthShell
      eyebrow="Folio IV · Confirmation"
      title={
        <>
          Confirm your <span className="italic text-gold">email.</span>
        </>
      }
      intro={
        token
          ? "One more click and your account is active."
          : "Enter your address below and we will send a fresh confirmation link."
      }
      plateImage="/images/signing-hands.jpg"
      plateNumber="IV"
      plateCaption="One click, and the record is opened in your name."
      footer={
        <>
          Need help?{" "}
          <Link
            href="/contact"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Contact us &rarr;
          </Link>
        </>
      }
    >
      {token ? (
        <ConfirmEmailForm token={token} email={email} />
      ) : (
        <ResendVerificationForm defaultEmail={email} />
      )}
    </AuthShell>
  );
}
