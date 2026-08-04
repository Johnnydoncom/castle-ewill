import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { currentUser } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Castle eWill & Trust account to draft, review, or update your Will.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <AuthShell
      eyebrow="Sign In"
      title={
        <>
          Welcome back to your <span className="italic text-gold">account.</span>
        </>
      }
      intro="Enter your credentials to resume drafting, review pending signatures, or access sealed documents."
      plateImage="/images/signing-hands.jpg"
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
