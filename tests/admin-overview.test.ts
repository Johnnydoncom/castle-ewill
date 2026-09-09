import { beforeEach, describe, expect, it, vi } from "vitest";

const apiData = vi.hoisted(() => vi.fn());
const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", () => ({ api, apiData }));

import { getAdminStats } from "@/lib/actions/admin";

/**
 * The console must survive a backend that predates it.
 *
 * The two apps deploy independently, so the frontend routinely runs for a few
 * minutes against an older API. `apiData` substitutes its fallback only when
 * the *request* fails — a successful response in an older shape is passed
 * through whole, and a page reading `stats.attention.wills_awaiting_review`
 * off it throws and takes the entire console to an error boundary.
 *
 * That is not hypothetical: it happened the moment `attention`, `funnel` and
 * two new trends shipped here before the API had them. The admin dashboard
 * went to "This page didn't load" and stayed there.
 */
beforeEach(() => {
  apiData.mockReset();
  api.mockReset();
});

/** The overview as it looked before the analytics were added. */
const OLD_SHAPE = {
  total_clients: 12,
  new_clients_this_month: 3,
  total_wills: 9,
  wills_awaiting_review: 2,
  wills_executed: 1,
  wills_by_status: { draft: 5 },
  revenue_kobo: 4_000_000,
  revenue_formatted: "₦40,000.00",
  open_messages: 1,
  will_trend: [{ month: "2026-09", total: 4 }],
  recent_audit: [],
};

describe("the overview, against an older backend", () => {
  it("fills in the fields that API does not have yet", async () => {
    apiData.mockResolvedValue(OLD_SHAPE);

    const stats = await getAdminStats();

    /*
     * The exact reads that crashed. Zero is wrong for a few minutes and right
     * forever after; `undefined` is a broken console.
     */
    expect(stats.attention.wills_awaiting_review).toBe(0);
    expect(stats.attention.draft_articles).toBe(0);
    expect(stats.funnel.drafted).toBe(0);
    expect(stats.revenue_trend).toEqual([]);
    expect(stats.client_trend).toEqual([]);
  });

  it("keeps everything the older backend did send", async () => {
    apiData.mockResolvedValue(OLD_SHAPE);

    const stats = await getAdminStats();

    // Degrading must not mean discarding — the page still shows real figures
    // for the fields that survived.
    expect(stats.total_clients).toBe(12);
    expect(stats.revenue_formatted).toBe("₦40,000.00");
    expect(stats.will_trend).toHaveLength(1);
  });

  it("does not let a half-populated attention block look complete", async () => {
    /*
     * An intermediate deploy — the API has learned some of the block but not
     * all of it. A shallow merge would pass this straight through and the
     * missing keys would still be `undefined`.
     */
    apiData.mockResolvedValue({
      ...OLD_SHAPE,
      attention: { wills_awaiting_review: 7 },
    });

    const stats = await getAdminStats();

    expect(stats.attention.wills_awaiting_review).toBe(7);
    expect(stats.attention.transfers_pending).toBe(0);
    expect(stats.attention.draft_articles).toBe(0);
  });

  it("survives a response with nothing in it at all", async () => {
    apiData.mockResolvedValue({});

    const stats = await getAdminStats();

    expect(stats.total_clients).toBe(0);
    expect(stats.attention.open_messages).toBe(0);
    expect(stats.funnel.printed).toBe(0);
    expect(stats.recent_audit).toEqual([]);
  });
});
