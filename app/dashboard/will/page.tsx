import { redirect } from "next/navigation";

import { getOrCreateDraft } from "@/lib/actions/will";
import { requireUser } from "@/lib/actions/guards";

export const dynamic = "force-dynamic";

/**
 * "Continue my Will" — resolves which one, then hands over to its own editor.
 *
 * This used to *be* the builder, with no Will in its address. That was fine
 * while every client had exactly one; with several, every link into it was a
 * guess and pressing Edit on one Will could open another.
 *
 * It stays as an entry point rather than being deleted, because it is the
 * honest home for "start or continue" — the only route that may legitimately
 * *create* a Will. Every link that already pointed here keeps working and
 * lands on the right document.
 */
export default async function WillBuilderEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  await requireUser();

  const { step } = await searchParams;

  // Creates one only when the client has none in flight.
  const will = await getOrCreateDraft();

  if (!will) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-navy">
          We could not open your Will. Please refresh and try again.
        </p>
      </div>
    );
  }

  const suffix = step ? `?step=${encodeURIComponent(step)}` : "";

  redirect(`/dashboard/wills/${will.id}/edit${suffix}`);
}
