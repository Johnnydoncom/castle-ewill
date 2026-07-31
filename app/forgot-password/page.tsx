import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description:
    "Request a secure link to choose a new password for your Castle eWill & Trust account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Folio III · Recovery"
      title={
        <>
          Let us restore your <span className="italic text-gold">access.</span>
        </>
      }
      intro="Enter the address on your account and we will send a single-use link. It expires in one hour."
      plateImage="/images/office-interior.jpg"
      plateNumber="III"
      plateCaption="Every door in this house can be reopened — carefully, and only by you."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Back to sign in &rarr;
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
