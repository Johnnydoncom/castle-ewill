import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Castle eWill & Trust account to draft, review, or update your Will.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthShell
      eyebrow="Folio I · Sign In"
      title={
        <>
          Welcome back to your <span className="italic text-gold">chambers.</span>
        </>
      }
      intro="Enter your credentials to resume drafting, review pending signatures, or access sealed documents."
      plateImage="/images/signing-hands.jpg"
      plateNumber="I"
      plateCaption="A signature is a promise made permanent. Yours is safeguarded."
      footer={
        <>
          New to Castle?{" "}
          <Link
            href="/register"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Open an account &rarr;
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
