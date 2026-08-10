import type { Metadata } from "next";
import { MailCheck, MailWarning } from "lucide-react";

import { getProfile, requireUser } from "@/lib/actions/guards";
import { profileCompletion } from "@/lib/actions/dashboard";
import { listWills } from "@/lib/actions/will";
import { PageHead } from "@/components/dashboard/PageHead";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { PhoneVerification } from "@/components/settings/PhoneVerification";
import { LifeEventForm } from "@/components/settings/LifeEventForm";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const sessionUser = await requireUser();

  /*
   * Read live rather than from the session cookie. The cookie was minted at
   * sign-in and may be a week old — it would still show "unverified" to someone
   * who confirmed their address ten minutes ago.
   */
  const profile = await getProfile();

  const percent = profile
    ? profileCompletion({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        isEmailVerified: profile.is_email_verified,
        image: profile.image,
      })
    : 0;
  const verified = Boolean(profile?.is_email_verified);

  // A life event is only worth reporting once there is an approved Will to
  // review — reviewing a draft nobody has finished makes no sense.
  const wills = await listWills();
  const reviewableWill = wills.find(
    (w) => w.status === "approved" || w.status === "executed",
  );

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Account Settings"
        title="Settings"
        blurb="Your account details and the controls that protect them."
      />

      <section className="border border-border bg-background p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl text-navy">Account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Profile {percent}% complete
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
              verified
                ? "border-success/50 text-success"
                : "border-gold/60 text-gold"
            }`}
          >
            {verified ? (
              <MailCheck className="h-3.5 w-3.5" />
            ) : (
              <MailWarning className="h-3.5 w-3.5" />
            )}
            {verified ? "Email verified" : "Email unverified"}
          </span>
        </div>

        <dl className="mt-8 divide-y divide-border border-t border-border">
          {[
            ["Name", profile?.name ?? "—"],
            ["Email", profile?.email ?? "—"],
            ["Phone", profile?.phone ?? "Not provided"],
            [
              "Member since",
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-4"
            >
              <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {label}
              </dt>
              <dd className="text-sm text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/*
        * Phone confirmation is optional, and an administrator can switch it
        * off entirely. Offering it when it is switched off would be asking
        * for something nothing will ever check.
        */}
      {profile?.requires_phone_verification && (
        <PhoneVerification
          phone={profile?.phone ?? null}
          verified={Boolean(profile?.is_phone_verified)}
        />
      )}

      <TwoFactorSettings enabled={Boolean(profile?.two_factor_enabled)} />

      {reviewableWill && <LifeEventForm willId={reviewableWill.id} />}

      <section className="border-l-2 border-gold/40 bg-gold/5 px-6 py-5">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Keeping your account safe
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy/80">
          <li>
            Your password is stored only as a bcrypt hash. Nobody at Castle can
            read it, and we will never ask you for it.
          </li>
          <li>
            Two-factor codes are generated on your own device. The shared secret
            is encrypted before it is stored, so a database copy alone cannot
            produce valid codes.
          </li>
          <li>
            After eight failed sign-in attempts an account locks for fifteen
            minutes.
          </li>
        </ul>
      </section>
    </div>
  );
}
