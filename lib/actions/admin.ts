import "server-only";

import { and, count, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  auditLogs,
  contactMessages,
  payments,
  users,
  wills,
} from "@/lib/db/schema";
import type { AuditLog, Payment, User, Will } from "@/lib/db/schema";

/**
 * Admin read models.
 *
 * Every query here is deliberately unscoped by user — these callers have
 * already passed `requireAdmin()`. Aggregates are computed in SQL rather than
 * by loading rows and counting in JS, so the console stays responsive as the
 * table grows.
 */

export type AdminStats = {
  totalClients: number;
  newClientsThisMonth: number;
  totalWills: number;
  willsAwaitingReview: number;
  willsExecuted: number;
  revenueKobo: number;
  openMessages: number;
};

const startOfMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    clientRows,
    newClientRows,
    willRows,
    reviewRows,
    executedRows,
    revenueRows,
    messageRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(eq(users.role, "user")),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "user"), gte(users.createdAt, startOfMonth()))),
    db.select({ value: count() }).from(wills),
    db
      .select({ value: count() })
      .from(wills)
      .where(inArray(wills.status, ["submitted", "under_review"])),
    db.select({ value: count() }).from(wills).where(eq(wills.status, "executed")),
    db
      .select({
        value: sql<string>`COALESCE(SUM(${payments.amountKobo}), 0)`,
      })
      .from(payments)
      .where(eq(payments.status, "success")),
    db
      .select({ value: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, "new")),
  ]);

  return {
    totalClients: clientRows[0]?.value ?? 0,
    newClientsThisMonth: newClientRows[0]?.value ?? 0,
    totalWills: willRows[0]?.value ?? 0,
    willsAwaitingReview: reviewRows[0]?.value ?? 0,
    willsExecuted: executedRows[0]?.value ?? 0,
    revenueKobo: Number(revenueRows[0]?.value ?? 0),
    openMessages: messageRows[0]?.value ?? 0,
  };
}

export type QueueEntry = {
  will: Will;
  clientName: string | null;
  clientEmail: string;
};

/** Wills submitted or in review, oldest first — the queue is worked FIFO. */
export async function getReviewQueue(limit = 10): Promise<QueueEntry[]> {
  const rows = await db
    .select({
      will: wills,
      clientName: users.name,
      clientEmail: users.email,
    })
    .from(wills)
    .innerJoin(users, eq(wills.userId, users.id))
    .where(inArray(wills.status, ["submitted", "under_review"]))
    .orderBy(wills.submittedAt)
    .limit(limit);

  return rows;
}

export type ClientRow = User & { willCount: number };

export async function listClients(options: {
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: ClientRow[]; total: number }> {
  const perPage = Math.min(options.perPage ?? 25, 100);
  const page = Math.max(options.page ?? 1, 1);
  const term = options.search?.trim();

  const filter = term
    ? or(like(users.name, `%${term}%`), like(users.email, `%${term}%`))
    : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        user: users,
        willCount: sql<number>`(SELECT COUNT(*) FROM ${wills} WHERE ${wills.userId} = ${users.id})`,
      })
      .from(users)
      .where(filter)
      .orderBy(desc(users.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(users).where(filter),
  ]);

  return {
    rows: rows.map((r) => ({ ...r.user, willCount: Number(r.willCount) })),
    total: totalRows[0]?.value ?? 0,
  };
}

export type AdminWillRow = {
  will: Will;
  clientName: string | null;
  clientEmail: string;
};

export async function listWills(options: {
  status?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: AdminWillRow[]; total: number }> {
  const perPage = Math.min(options.perPage ?? 25, 100);
  const page = Math.max(options.page ?? 1, 1);

  const validStatuses = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "executed",
    "archived",
  ] as const;

  const status = validStatuses.find((s) => s === options.status);
  const filter = status ? eq(wills.status, status) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({ will: wills, clientName: users.name, clientEmail: users.email })
      .from(wills)
      .innerJoin(users, eq(wills.userId, users.id))
      .where(filter)
      .orderBy(desc(wills.updatedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(wills).where(filter),
  ]);

  return { rows, total: totalRows[0]?.value ?? 0 };
}

export type AdminPaymentRow = {
  payment: Payment;
  clientName: string | null;
  clientEmail: string;
};

export async function listPayments(options: {
  page?: number;
  perPage?: number;
}): Promise<{ rows: AdminPaymentRow[]; total: number; successKobo: number }> {
  const perPage = Math.min(options.perPage ?? 25, 100);
  const page = Math.max(options.page ?? 1, 1);

  const [rows, totalRows, successRows] = await Promise.all([
    db
      .select({
        payment: payments,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(payments),
    db
      .select({ value: sql<string>`COALESCE(SUM(${payments.amountKobo}), 0)` })
      .from(payments)
      .where(eq(payments.status, "success")),
  ]);

  return {
    rows,
    total: totalRows[0]?.value ?? 0,
    successKobo: Number(successRows[0]?.value ?? 0),
  };
}

export async function listRecentAudit(limit = 20): Promise<AuditLog[]> {
  return db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/** Wills created per month for the last six months, for the overview chart. */
export async function getWillTrend(): Promise<
  Array<{ month: string; total: number }>
> {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 5);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`DATE_FORMAT(${wills.createdAt}, '%Y-%m')`,
      total: count(),
    })
    .from(wills)
    .where(gte(wills.createdAt, since))
    .groupBy(sql`DATE_FORMAT(${wills.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${wills.createdAt}, '%Y-%m')`);

  // Fill gaps so a quiet month renders as zero rather than disappearing.
  const byMonth = new Map(rows.map((r) => [r.month, Number(r.total)]));
  const result: Array<{ month: string; total: number }> = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(since);
    date.setUTCMonth(since.getUTCMonth() + i);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    result.push({ month: key, total: byMonth.get(key) ?? 0 });
  }

  return result;
}
