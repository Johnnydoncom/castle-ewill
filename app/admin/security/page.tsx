import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { requireAdmin } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Secure your administrator account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Two-factor setup for an administrator, before the console will open.
 *
 * Outside the `(console)` group for the same reason as the sign-in page: the
 * console's layout sends an administrator without a second factor here, so
 * this page cannot sit behind that layout. The setup itself is the account's
 * own (`/two-factor/*`), which the API leaves reachable.
 */
export default async function AdminSecurityPage() {
  const admin = await requireAdmin({ allowWithoutTwoFactor: true });

  if (admin.twoFactorEnabled) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo linked={false} variant="light" size={44} />
          <p className="mt-4 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            Administrator Console
          </p>
        </div>

        <div className="space-y-6 border border-navy-foreground/15 bg-background p-8">
          <div>
            <h1 className="font-serif text-2xl text-navy">Switch on two-factor sign-in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The console holds clients&apos; accounts, payments and — with their
              permission — their Wills, so a password alone is not enough to open
              it. Set up an authenticator app, then continue.
            </p>
          </div>

          <TwoFactorSettings enabled={false} />

          {/*
            A full load, not a client-side navigation: the Router Cache would
            replay the redirect that brought the administrator here.
          */}
          <a
            href="/admin"
            className="inline-flex h-11 items-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Continue to the console
          </a>
        </div>
      </div>
    </div>
  );
}
