import type { Metadata } from "next";
import Link from "next/link";
import { FolderTree, Plus } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { Cell, StatusBadge, Table } from "@/components/admin/DataTable";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { listAdminPosts, type AdminPost, type PostStatus } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

/** Drafts change as they are written; this is never a cached view. */
export const dynamic = "force-dynamic";

const FILTERS: Array<{ label: string; status?: PostStatus }> = [
  { label: "All" },
  { label: "Draft", status: "draft" },
  { label: "Scheduled", status: "scheduled" },
  { label: "Published", status: "published" },
  { label: "Archived", status: "archived" },
];

/**
 * What the badge says, which is not simply the status.
 *
 * "Scheduled" and "live" are the same status either side of an hour, and a row
 * claiming to be scheduled when its date has passed is a row nobody trusts —
 * so the derived `is_live` decides, not the stored word.
 */
function badge(post: AdminPost): { label: string; tone: "success" | "warn" | "neutral" } {
  if (post.is_live) return { label: "Live", tone: "success" };
  if (post.status === "scheduled") return { label: "Scheduled", tone: "warn" };
  if (post.status === "published") return { label: "Dated ahead", tone: "warn" };
  if (post.status === "archived") return { label: "Archived", tone: "neutral" };

  return { label: "Draft", tone: "neutral" };
}

function when(post: AdminPost): string {
  if (!post.published_at) return "—";

  const date = new Date(post.published_at).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return post.is_live ? date : `${date} (ahead)`;
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdminPermission("manage_content");

  const { status, search } = await searchParams;

  const active = FILTERS.find((filter) => filter.status === status)?.status;

  const posts = await listAdminPosts({ status: active, search });

  const live = posts.filter((post) => post.is_live).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          kicker="Registry · Blog"
          title="Blog"
          blurb={
            posts.length === 0
              ? "Nothing here yet."
              : `${posts.length} article${posts.length === 1 ? "" : "s"}, ${live} live.`
          }
        />

        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/categories"
            className="flex h-11 items-center gap-2 border border-border px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-navy hover:text-navy"
          >
            <FolderTree className="h-4 w-4" />
            Categories
          </Link>

          <Link
            href="/admin/posts/new"
            className="flex h-11 items-center gap-2 bg-navy px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            <Plus className="h-4 w-4" />
            Write an article
          </Link>
        </div>
      </div>

      {/*
        Filtering by link rather than by a client-side control: the state then
        lives in the URL, so a filtered view can be shared, bookmarked and
        returned to by the back button.
      */}
      <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
        {FILTERS.map((filter) => {
          const selected = filter.status === active;

          return (
            <Link
              key={filter.label}
              href={filter.status ? `/admin/posts?status=${filter.status}` : "/admin/posts"}
              aria-current={selected ? "page" : undefined}
              className={`border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                selected
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border text-muted-foreground hover:border-navy hover:text-navy"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <Table
        headers={["Article", "Category", "Status", "Published", ""]}
        isEmpty={posts.length === 0}
        empty={
          active
            ? "Nothing with that status."
            : "No articles yet. The blog on the public site is empty until one is published here."
        }
      >
        {posts.map((post) => {
          const { label, tone } = badge(post);

          return (
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
                {post.tags.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </span>
                )}
              </Cell>

              <Cell muted>{post.category?.name ?? "—"}</Cell>

              <Cell>
                <StatusBadge label={label} tone={tone} />
              </Cell>

              <Cell muted>
                {when(post)}
                <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                  {post.reading_minutes} min read
                </span>
              </Cell>

              <Cell>
                <PostRowActions post={post} />
              </Cell>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
