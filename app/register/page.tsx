import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Open an account",
  description:
    "Create your Castle eWill & Trust account and begin drafting a legally sound Will in minutes.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Folio II · Registration"
      title={
        <>
          Begin the <span className="italic text-gold">record</span> of your
          wishes.
        </>
      }
      intro="Three fields and a confirmation link. No card required until you choose to seal your Will."
      plateImage="/images/father-daughter.jpg"
      plateNumber="II"
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
      <RegisterForm />
    </AuthShell>
  );
}
