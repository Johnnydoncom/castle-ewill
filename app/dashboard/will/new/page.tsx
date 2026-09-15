import { redirect } from "next/navigation";

import { startNewWill } from "@/lib/actions/will";
import { requireUser } from "@/lib/actions/guards";

export const dynamic = "force-dynamic";

/**
 * "Start a new Will" — for a lawyer, another client's.
 *
 * The companion to `/dashboard/will`, which continues the Will in flight. The
 * server decides what "new" may mean: a verified lawyer gets a fresh Will (or
 * the blank one they already have), and anybody else is returned to their one.
 * Linked without prefetching, since opening it can create a Will.
 */
export default async function StartNewWillPage() {
  await requireUser();

  const will = await startNewWill();

  if (!will) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-navy">
          We could not start a new Will. Please refresh and try again.
        </p>
      </div>
    );
  }

  redirect(`/dashboard/wills/${will.id}/edit?step=1`);
}
