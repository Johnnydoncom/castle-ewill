import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { currentUser } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Open an account",
  description:
    "Create your Castle eWill & Trust account and begin drafting a legally sound Will in minutes.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  // `?type=lawyer` from the pricing page preselects the practitioner path, so
  // someone arriving from "register as a lawyer" is not asked the question
  // they have already answered.
  const { type } = await searchParams;

  return (
    <AuthShell
      eyebrow="Registration"
      title={
        <>
          Begin the <span className="italic text-gold">record</span> of your
          wishes.
        </>
      }
      intro="Three fields and a confirmation link. No card required until you choose to seal your Will."
      plateImage="/images/father-daughter.jpg"
      plateCaption="The most valuable thing you leave behind is clarity."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Sign in &rarr;
          </Link>
        </>
      }
    >
      <RegisterForm initialAccountType={type === "lawyer" ? "lawyer" : "individual"} />
    </AuthShell>
  );
}
