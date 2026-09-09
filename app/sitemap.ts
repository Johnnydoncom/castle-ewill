import type { MetadataRoute } from "next";

import { listPublishedPosts } from "@/lib/actions/content";

/**
 * The sitemap, built from the routes that actually exist.
 *
 * There was none — `/sitemap.xml` answered 404 — so every article was
 * discoverable only by crawling links from the blog index, and a crawler that
 * never reached the index never reached the articles at all.
 *
 * **Public pages only.** `/dashboard` and `/admin` are behind a session and
 * have nothing to offer a crawler; `/verify/[token]` is a per-document lookup
 * with no fixed set of URLs. Listing any of them would spend crawl budget on
 * pages that answer a redirect.
 *
 * Regenerated on the same window as the blog itself, so an article published
 * in the console appears here without a deploy.
 */
export const revalidate = 300;

/** Where the site actually lives. Wrong here means wrong in every entry. */
function siteUrl(): string {
  return (process.env.APP_URL ?? "https://castlewilltrust.com").replace(/\/+$/, "");
}

/**
 * The fixed pages, with a rough sense of how often each changes.
 *
 * `priority` is a hint and a weak one — search engines largely ignore it — so
 * these are ordered by what the site is for rather than tuned: writing a Will
 * first, the reasons to trust us next, the legal boilerplate last.
 */
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services", changeFrequency: "monthly", priority: 0.8 },
  { path: "/wills/new", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/faqs", changeFrequency: "monthly", priority: 0.6 },
  { path: "/security", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const fixed = STATIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  /*
   * Articles, if the backend answers. `listPublishedPosts()` degrades to an
   * empty list rather than throwing, so an unreachable API costs the articles
   * from this build's sitemap — not the sitemap, and not the build.
   */
  const posts = await listPublishedPosts(200);

  return [
    ...fixed,
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
