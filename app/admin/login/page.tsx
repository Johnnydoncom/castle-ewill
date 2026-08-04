import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { currentUser } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Administrator sign in",
  // Never indexed, and never linked from the public site — this door is
  // found by knowing it exists, not by browsing.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A deliberately plain sign-in, separate from the customer portal's.
 *
 * No marketing chrome, no "open an account" link — administrators are
 * provisioned directly, never through public registration (see
 * `RegisterController`, which always creates `role: user`). Sitting outside
 * the `(console)` route group is what keeps this reachable without an
 * existing session: `app/admin/(console)/layout.tsx` calls `requireAdmin()`
 * on everything inside it, and this page is not inside it.
 */
export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo linked={false} variant="light" size={44} />
          <p className="mt-4 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            Administrator Console
          </p>
        </div>

        <div className="border border-navy-foreground/15 bg-background p-8">
          <h1 className="font-serif text-2xl text-navy">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Restricted to Castle eWill &amp; Trust staff.
          </p>

          <div className="mt-8">
            <AdminLoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-navy-foreground/50">
          Looking for your Will instead?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-gold">
            Sign in to the customer portal
          </Link>
        </p>
      </div>
    </div>
  );
}
