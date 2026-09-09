import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import { PostEditor } from "@/components/admin/PostEditor";
import { listPostCategories } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Write an article",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdminPermission("manage_content");

  const categories = await listPostCategories();

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Blog · New"
        title="Write an article"
        blurb="Saved as a draft unless you say otherwise. The web address is made from the headline."
      />

      <PostEditor categories={categories} />
    </div>
  );
}
