
import "server-only";

import { api, apiData } from "@/lib/api/client";

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

export type Plan = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_kobo: number;
  price_formatted: string;
  currency: string;
  features: string[];
  is_popular: boolean;
  sort_order: number;
};

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

export type PaymentProviders = {
  paystack: boolean;
  flutterwave: boolean;
  bank_transfer: boolean;
};

export async function listActivePlans(): Promise<Plan[]> {
  return apiData<Plan[]>("/plans", [], { authenticated: false });
}

/**
 * Which payment methods are actually configured.
 *
 * Booleans, derived server-side from whether the credentials are present — the
 * keys themselves never leave the backend. Used to hide a checkout button that
 * would only ever answer "not enabled yet".
 */
export async function getPaymentProviders(): Promise<PaymentProviders> {
  const result = await api<{ meta?: { providers?: PaymentProviders } }>("/plans", {
    authenticated: false,
  });

  const fallback: PaymentProviders = {
    paystack: false,
    flutterwave: false,
    bank_transfer: true,
  };

  return result.ok ? (result.data.meta?.providers ?? fallback) : fallback;
}

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
