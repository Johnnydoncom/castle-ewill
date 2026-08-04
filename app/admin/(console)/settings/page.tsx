import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { StatusBadge } from "@/components/admin/DataTable";
import { BankAccountForm } from "@/components/admin/BankAccountForm";
import { getAdminHealth } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Dependency health, read from the backend.
 *
 * The checks have to run there. This tier no longer holds a database
 * connection, an SMTP account, a vault key or a payment secret — a check
 * performed from here would be checking nothing and reporting green.
 */
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPermission("manage_settings");

  const { checks, bank_account: bank } = await getAdminHealth();

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Registry · Settings"
        title="Settings"
        blurb="Platform configuration and the health of every external dependency."
      />

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">System health</h2>
        <ul className="divide-y divide-border border border-border bg-background">
          {checks.map((check) => (
            <li
              key={check.name}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div className="flex items-start gap-3">
                {check.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium text-navy">{check.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {check.detail}
                  </p>
                </div>
              </div>
              <StatusBadge
                label={check.ok ? "OK" : "Attention"}
                tone={check.ok ? "success" : "warn"}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Company record</h2>
        <dl className="divide-y divide-border border border-border bg-background">
          {[
            ["Registered name", COMPANY.legalName],
            ["RC number", COMPANY.rcNumber],
            ["Registered address", COMPANY.address],
            ["Email", COMPANY.email],
            ["Phone", COMPANY.phone],
            ["Nature of business", COMPANY.business],
          ].map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-4"
            >
              <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {label}
              </dt>
              <dd className="text-sm text-navy">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs italic text-muted-foreground">
          These values come from <code>lib/company.ts</code> here and
          <code>config/company.php</code> in the backend — the two sources of
          truth for markup and for generated documents respectively. They must
          agree; the generated Will is the one that has to be right.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Bank transfer details</h2>

        {!bank.configured && (
          <p className="border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-navy">
            Not yet configured. Clients choosing bank transfer are shown a notice
            asking them to call, rather than an account number that is not ours.
          </p>
        )}

        <div className="border border-border bg-background p-6 sm:p-8">
          <BankAccountForm account={bank} />
        </div>
      </section>
    </div>
  );
}
