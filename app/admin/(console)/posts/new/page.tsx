import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import { PostEditor } from "@/components/admin/PostEditor";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Write an article",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdminPermission("manage_content");

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Blog · New"
        title="Write an article"
        blurb="Saved as a draft unless you tick Published. The web address is made from the headline."
      />

      <PostEditor />
    </div>
  );
}
