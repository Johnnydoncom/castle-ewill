import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { notifications, payments, wills } from "@/lib/db/schema";
import type { Notification, Payment, Will } from "@/lib/db/schema";

export type DashboardData = {
  wills: Will[];
  activeWill: Will | undefined;
  notifications: Notification[];
  unreadCount: number;
  payments: Payment[];
};

/** One round of queries for the dashboard overview. */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [willRows, notificationRows, unreadRows, paymentRows] =
    await Promise.all([
      db
        .select()
        .from(wills)
        .where(eq(wills.userId, userId))
        .orderBy(desc(wills.updatedAt)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(6),
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            isNull(notifications.readAt),
          ),
        ),
      db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(5),
    ]);

  return {
    wills: willRows,
    activeWill: willRows.find((w) => w.status === "draft") ?? willRows[0],
    notifications: notificationRows,
    unreadCount: unreadRows.length,
    payments: paymentRows,
  };
}

/** Profile completeness, shown alongside Will completeness on the dashboard. */
export function profileCompletion(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  emailVerifiedAt?: Date | null;
  image?: string | null;
}): number {
  const checks = [
    Boolean(user.name),
    Boolean(user.email),
    Boolean(user.emailVerifiedAt),
    Boolean(user.phone),
    Boolean(user.image),
  ];
  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );
}
