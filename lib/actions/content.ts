
import "server-only";

import { apiData } from "@/lib/api/client";

/**
 * Public content reads, delegated to the API.
 *
 * These pages are visited by anonymous traffic, so each function degrades to an
 * empty list when the backend is unreachable rather than taking the marketing
 * site down with a 500. `apiData` already logs the failure for operators.
 *
 * Every call is unauthenticated — there is no session on these pages, and the
 * endpoints behind them are public reads.
 */

export type Post = {
  id: string;
  slug: string;
  title: string;
  /**
   * A row now, not a free-text string — so the blog can filter by it and two
   * spellings cannot become two categories.
   */
  category: { name: string; slug: string } | null;
  tags: Array<{ name: string; slug: string }>;
  excerpt: string;
  /**
   * **HTML**, sanitised server-side on the way in — see `ArticleHtml` in the
   * backend. Absent from the index listing; only the single-post read carries
   * it, because a listing that ships every article in full is a slow listing.
   */
  body?: string;
  cover_image_url: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  reading_minutes: number;
  published_at: string;
};

/*
 * Prices live in `lib/pricing.ts`, not here.
 *
 * They were two functions in this module that each fetched `/plans`
 * separately — the pricing page requested the same list twice, and only ever
 * saw the tiers, never the lodging fee that can make up the rest of
 * the bill. `getPriceList()` is one request, grouped by kind, and carries
 * the precomposed totals.
 */

/**
 * How long an article may be reused for.
 *
 * Articles are edited in the console and read by everybody; five minutes is
 * far inside the time it takes anyone to notice, and it is the difference
 * between the blog rendering at the edge and rendering on the origin behind a
 * call to Laravel.
 */
export const POST_TTL_SECONDS = 300;

export async function listPublishedPosts(limit = 24): Promise<Post[]> {
  const posts = await apiData<Post[]>("/posts", [], {
    authenticated: false,
    revalidate: POST_TTL_SECONDS,
  });

  return posts.slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return apiData<Post | null>(`/posts/${encodeURIComponent(slug)}`, null, {
    authenticated: false,
    revalidate: POST_TTL_SECONDS,
  });
}

/**
 * Kobo to a displayed naira figure.
 *
 * Kept for the places that render a raw kobo value. Where the API already
 * supplies `price_formatted`, prefer that — the backend and the frontend
 * disagreeing about rounding is exactly the sort of thing a client notices on
 * an invoice.
 */
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}
