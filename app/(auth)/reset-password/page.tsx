import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      eyebrow="Password Recovery"
      title={
        <>
          Choose a new <span className="italic text-gold">password.</span>
        </>
      }
      intro="Pick something long and memorable. Length protects an account far better than exotic symbols."
      plateImage="/images/office-interior.jpg"
      plateCaption="A good password is a long one you can actually remember."
      footer={
        <>
          Need a fresh link?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Request another &rarr;
          </Link>
        </>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy">
          This reset link is incomplete. Request a new one from the{" "}
          <Link href="/forgot-password" className="underline underline-offset-4">
            password recovery page
          </Link>
          .
        </div>
      )}
    </AuthShell>
  );
}
