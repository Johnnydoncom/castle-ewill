import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MailWarning, MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { verifyEmailToken } from "@/lib/actions/auth";

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

  // Consuming the token is a state change, so it happens once here on the
  // server and the outcome decides what the page renders.
  const outcome = token ? await verifyEmailToken(token) : null;

  return (
    <AuthShell
      eyebrow="Folio IV · Confirmation"
      title={
        outcome === "verified" || outcome === "already" ? (
          <>
            Your account is <span className="italic text-gold">confirmed.</span>
          </>
        ) : (
          <>
            Confirm your <span className="italic text-gold">email.</span>
          </>
        )
      }
      intro={
        outcome === "verified"
          ? "Thank you. Your email address has been verified and your account is now active."
          : outcome === "already"
            ? "This address was already confirmed. You can sign in whenever you are ready."
            : outcome === "invalid"
              ? "That confirmation link has expired or has already been used."
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
      {outcome === "verified" || outcome === "already" ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-navy">
            {outcome === "verified" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            )}
            <p>
              {outcome === "verified"
                ? "Email address verified."
                : "This address was confirmed previously."}
            </p>
          </div>
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center bg-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Sign in to your dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {outcome === "invalid" && (
            <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy">
              <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>
                Confirmation links expire after 24 hours and can only be used
                once. Request another below.
              </p>
            </div>
          )}
          <ResendVerificationForm defaultEmail={email} />
        </div>
      )}
    </AuthShell>
  );
}
