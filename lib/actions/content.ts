import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { plans, posts } from "@/lib/db/schema";
import type { Plan, Post } from "@/lib/db/schema";

/**
 * Public content reads.
 *
 * These pages are visited by anonymous traffic, so each function degrades to an
 * empty list if the database is unreachable rather than throwing a 500 on the
 * marketing site. The failure is logged for operators.
 */

export async function listActivePlans(): Promise<Plan[]> {
  try {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(asc(plans.sortOrder));
  } catch (error) {
    console.error("[content] failed to load plans", error);
    return [];
  }
}

export async function listPublishedPosts(limit = 24): Promise<Post[]> {
  try {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.isPublished, true))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
  } catch (error) {
    console.error("[content] failed to load posts", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    return post?.isPublished ? post : null;
  } catch (error) {
    console.error("[content] failed to load post", error);
    return null;
  }
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}
