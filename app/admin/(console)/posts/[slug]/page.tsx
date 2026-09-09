import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHead } from "@/components/dashboard/PageHead";
import { PostEditor } from "@/components/admin/PostEditor";
import { getAdminPost, listPostCategories } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Edit article",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** What the kicker says, which is not always the status. */
function stage(status: string, isLive: boolean): string {
  if (status === "scheduled") return isLive ? "Blog · Live" : "Blog · Scheduled";
  if (status === "published") return isLive ? "Blog · Live" : "Blog · Dated ahead";

  return status === "archived" ? "Blog · Archived" : "Blog · Draft";
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPermission("manage_content");

  const { slug } = await params;

  const [post, categories] = await Promise.all([
    getAdminPost(slug),
    listPostCategories(),
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-8">
      <PageHead
        kicker={stage(post.status, post.is_live)}
        title={post.title}
        blurb="Changing the headline does not move the web address — the link anybody has already shared keeps working."
      />

      <PostEditor post={post} categories={categories} />
    </div>
  );
}
