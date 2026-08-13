import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import { PlanEditor } from "@/components/admin/PlanEditor";
import { listAllPlans } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Pricing",
  robots: { index: false, follow: false },
};

/** Prices are read per request; a change must be live immediately. */
export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  // Pricing sits under the payments permission: both are the money surface,
  // and the trust decision to delegate one is plainly the same as the other.
  await requireAdminPermission("manage_payments");

  const plans = await listAllPlans();

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Pricing"
        title="Pricing"
        blurb="What clients are charged. Every change is audited with the old and new price."
      />

      <div className="border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
        <p>
          A <strong>Will plan</strong> is a tier the client chooses, charged
          once per Will. The <strong>lodging fee</strong> is optional and is
          added to any Will plan that does not absorb it. The{" "}
          <strong>annual subscription</strong> is optional and buys free
          amendments on the platform — it never covers lodging.
        </p>
        <p className="mt-2 text-muted-foreground">
          Only the first published lodging fee and subscription are used.
          Withdrawing a plan takes it off sale without disturbing the payments
          that already reference it.
        </p>
      </div>

      <PlanEditor plans={plans} />
    </div>
  );
}
