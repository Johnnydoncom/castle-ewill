import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPostBySlug, listPublishedPosts } from "@/lib/actions/content";

/** Reused for five minutes — see the note on the homepage. */
export const revalidate = 300;

/**
 * Every published article, pre-rendered at build.
 *
 * Without this the route is only ever rendered on demand: the first visitor to
 * each article — very often a crawler — waits on the origin and a round trip
 * to Laravel, and that is the request search engines time. With it, the whole
 * blog is HTML at the edge, and a post published later is picked up on the
 * next revalidation rather than needing a deploy.
 *
 * An unreachable backend at build time yields an empty list rather than a
 * failed build; those routes then render on demand exactly as they do today.
 */
export async function generateStaticParams() {
  const posts = await listPublishedPosts();

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Article not found" };

  return {
    title: post.title,
    description: post.excerpt,
    // Per slug, so each article is its own canonical rather than inheriting
    // one — see the note in the root layout.
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at,
      // Restated because a page's `openGraph` replaces the layout's outright —
      // without this an article previews with no image at all.
      images: [{ url: "/images/hero-family.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <>

      <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="h-px w-10 bg-gold" />
          <span className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            {post.category}
          </span>
        </div>

        <h1 className="font-serif text-4xl leading-tight text-navy sm:text-5xl">
          {post.title}
        </h1>

        <p className="mt-5 font-serif text-lg italic leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        <p className="mt-6 border-b border-border pb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {post.reading_minutes} min read &middot;{" "}
          {new Date(post.published_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="mt-10 space-y-6">
          {(post.body ?? "").split("\n\n").map((paragraph, index) => (
            <p
              key={index}
              className="font-serif text-lg leading-[1.75] text-navy/90"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <Link
            href="/blog"
            className="text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
          >
            &larr; All resources
          </Link>
        </div>
      </article>

      <section className="border-t border-border bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl">
            Ready to put this{" "}
            <span className="italic text-gold">in writing?</span>
          </h2>
          <Link
            href="/register"
            className="mt-8 inline-block bg-gold px-10 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90"
          >
            Begin your Will
          </Link>
        </div>
      </section>
    </>
  );
}
