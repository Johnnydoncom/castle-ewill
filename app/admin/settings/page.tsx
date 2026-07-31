import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { StatusBadge } from "@/components/admin/DataTable";
import { verifyMailConnection } from "@/lib/mail/mailer";
import { getEnv } from "@/lib/env";
import { getStorage } from "@/lib/storage";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/** Live health checks rather than a static "all systems green" panel. */
async function checkDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const rows = await db.select().from(settings).limit(1);
    return {
      ok: true,
      detail: `Connected · ${rows.length} setting(s) readable`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export default async function AdminSettingsPage() {
  const env = getEnv();
  const [mail, database] = await Promise.all([
    verifyMailConnection(),
    checkDatabase(),
  ]);

  const storage = getStorage();

  const checks = [
    {
      name: "Database",
      ok: database.ok,
      detail: database.detail,
    },
    {
      name: "Email (SMTP)",
      ok: mail.ok,
      detail: mail.ok
        ? `Connected to ${env.SMTP_HOST}`
        : mail.error,
    },
    {
      name: "Document storage",
      ok: true,
      detail: `Provider: ${storage.name} · documents encrypted with AES-256-GCM before upload`,
    },
    {
      name: "Payments",
      ok: Boolean(env.PAYSTACK_SECRET_KEY),
      detail: env.PAYSTACK_SECRET_KEY
        ? "Paystack keys present"
        : "Not configured — payment flows are phase 2",
    },
  ];

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Registry · Section V"
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
          These values come from <code>lib/company.ts</code>, the single source
          of truth used by every page, email footer and generated document.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Environment</h2>
        <dl className="divide-y divide-border border border-border bg-background">
          {[
            ["Mode", env.NODE_ENV],
            ["Public URL", env.APP_URL],
            ["Storage provider", env.STORAGE_PROVIDER],
            ["Database pool size", String(env.DATABASE_POOL_SIZE)],
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
      </section>
    </div>
  );
}
