import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { listPostCategories } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Blog categories",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PostCategoriesPage() {
  await requireAdminPermission("manage_content");

  const categories = await listPostCategories();

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Blog · Categories"
        title="Categories"
        blurb="What articles are filed under. Deleting one leaves its articles behind, uncategorised."
      />

      <Link
        href="/admin/posts"
        className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
      >
        &larr; Back to the blog
      </Link>

      <CategoryManager categories={categories} />
    </div>
  );
}
