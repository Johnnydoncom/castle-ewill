import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { Cell, StatusBadge, Table } from "@/components/admin/DataTable";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { listAdminPosts } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

/** Drafts change as they are written; this is never a cached view. */
export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  await requireAdminPermission("manage_content");

  const posts = await listAdminPosts();

  const published = posts.filter((post) => post.is_published).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          kicker="Registry · Blog"
          title="Blog"
          blurb={
            posts.length === 0
              ? "Nothing written yet."
              : `${posts.length} article${posts.length === 1 ? "" : "s"}, ${published} live.`
          }
        />

        <Link
          href="/admin/posts/new"
          className="flex h-11 items-center gap-2 bg-navy px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
        >
          <Plus className="h-4 w-4" />
          Write an article
        </Link>
      </div>

      <Table
        headers={["Article", "Category", "Status", "Published", ""]}
        isEmpty={posts.length === 0}
        empty="No articles yet. The blog on the public site is empty until one is published here."
      >
        {posts.map((post) => (
          <tr key={post.id}>
            <Cell>
              <Link
                href={`/admin/posts/${post.slug}`}
                className="font-medium text-navy underline-offset-4 hover:underline"
              >
                {post.title}
              </Link>
              <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                {post.excerpt}
              </span>
            </Cell>

            <Cell muted>{post.category}</Cell>

            <Cell>
              <StatusBadge
                label={post.is_published ? "Live" : "Draft"}
                tone={post.is_published ? "success" : "neutral"}
              />
            </Cell>

            <Cell muted>
              {/*
                A draft's `published_at` is a date it has not reached, so it is
                shown as a dash rather than as a date somebody might read as
                fact.
              */}
              {post.is_published && post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
              <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                {post.reading_minutes} min read
              </span>
            </Cell>

            <Cell>
              <PostRowActions post={post} />
            </Cell>
          </tr>
        ))}
      </Table>
    </div>
  );
}
