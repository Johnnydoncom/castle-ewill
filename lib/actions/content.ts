
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
  category: string;
  excerpt: string;
  /** Absent from the index listing — only the single-post read carries it. */
  body?: string;
  reading_minutes: number;
  published_at: string;
};

/*
 * Prices live in `lib/pricing.ts`, not here.
 *
 * They were two functions in this module that each fetched `/plans`
 * separately — the pricing page requested the same list twice, and only ever
 * saw the tiers, never the compulsory lodging fee that makes up the rest of
 * the bill. `getPriceList()` is one request, grouped by kind, and carries
 * the precomposed totals.
 */

export async function listPublishedPosts(limit = 24): Promise<Post[]> {
  const posts = await apiData<Post[]>("/posts", [], { authenticated: false });

  return posts.slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return apiData<Post | null>(`/posts/${encodeURIComponent(slug)}`, null, {
    authenticated: false,
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
