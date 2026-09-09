import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHead } from "@/components/dashboard/PageHead";
import { PostEditor } from "@/components/admin/PostEditor";
import { getAdminPost } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Edit article",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPermission("manage_content");

  const { slug } = await params;
  const post = await getAdminPost(slug);

  if (!post) notFound();

  return (
    <div className="space-y-8">
      <PageHead
        kicker={post.is_published ? "Blog · Live" : "Blog · Draft"}
        title={post.title}
        blurb="Changing the headline does not move the web address — the link anybody has already shared keeps working."
      />

      <PostEditor post={post} />
    </div>
  );
}
