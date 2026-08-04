import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import { StatusBadge, formatDate } from "@/components/admin/DataTable";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { AdminPermissionsEditor } from "@/components/admin/AdminPermissionsEditor";
import { listAdmins } from "@/lib/actions/admin";
import { requireSuperAdmin } from "@/lib/actions/guards";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Administrators",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Who has console access, and to what.
 *
 * Superadmin-only — `requireSuperAdmin()` sends anyone else back to
 * Overview, and the API refuses the same way regardless of what this page
 * renders. There is exactly one superadmin in practice (the account this
 * migrated from is the only one seeded), but the data model does not assume
 * that; it just never offers a way to create a second one from here.
 */
export default async function AdminAccountsPage() {
  const me = await requireSuperAdmin();
  const admins = await listAdmins();

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Registry · Administrators"
        title="Administrators"
        blurb="Who can sign in to the console, and which sections they can use. Delegate a section without sharing the superadmin account."
      />

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Add an administrator</h2>
        <div className="border border-border bg-surface p-6">
          <CreateAdminForm />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Current administrators</h2>
        <ul className="divide-y divide-border border border-border bg-background">
          {admins.map(({ admin, is_superadmin: isSuperAdmin, permissions }) => (
            <li key={admin.id} className="space-y-4 px-5 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-navy">
                    {admin.name ?? "—"}
                    {admin.id === me.id && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    Added {formatDate(admin.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge
                    label={admin.status}
                    tone={admin.status === "active" ? "success" : "danger"}
                  />
                  {isSuperAdmin && (
                    <span className="border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                      Superadmin
                    </span>
                  )}
                </div>
              </div>

              {isSuperAdmin ? (
                <p className="text-xs italic text-muted-foreground">
                  The superadmin has access to every section and cannot be scoped or suspended.
                </p>
              ) : (
                <>
                  {permissions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Currently:{" "}
                      {permissions.map((p) => ADMIN_PERMISSION_LABELS[p] ?? p).join(", ")}
                    </p>
                  )}
                  <AdminPermissionsEditor
                    userId={admin.id}
                    currentPermissions={permissions}
                    status={admin.status}
                    isSelf={admin.id === me.id}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
