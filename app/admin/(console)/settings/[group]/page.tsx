import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { SettingsGroupForm } from "@/components/admin/SettingsGroupForm";
import { SettingsNav } from "@/components/admin/SettingsNav";
import { getSettingGroups } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One settings module per page.
 *
 * A single scrolling page held every group at once, which made "change the SMS
 * sender" a hunt through payment credentials. The groups are declared on the
 * server (`SettingsCatalog`), so this route is driven by that list rather than
 * by a hand-written set of files — adding a group there gives it a page here
 * with nothing further to write.
 */
export default async function SettingsGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  await requireAdminPermission("manage_settings");

  const { group: slug } = await params;
  const groups = await getSettingGroups();
  const group = groups.find((g) => g.key === slug);

  // An unknown slug is a 404 rather than a redirect: a typed URL that silently
  // lands somewhere else is harder to diagnose than one that says "no".
  if (!group) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All settings
        </Link>
      </div>

      <PageHead
        kicker="Registry · Settings"
        title={group.label}
        blurb={group.description}
      />

      <SettingsNav groups={groups} current={group.key} />

      <SettingsGroupForm group={group} />
    </div>
  );
}
