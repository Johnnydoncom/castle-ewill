import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api/browser";

/**
 * A stale CSRF token must not lock anybody out.
 *
 * Reported on 2026-09-11 as "CSRF token mismatch" on every sign-in and
 * registration. Reproduced against production: when the server session behind
 * an `XSRF-TOKEN` cookie is gone, Laravel answers 419 with a *new session
 * cookie but no new `XSRF-TOKEN`*. The client only fetched a token when it had
 * none, so it sent the same stale one on every attempt until the cookie expired
 * two hours later.
 */

const API = "https://api.example.test/api/v1";

let cookie = "";
const fetchMock = vi.fn();

const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const headersOf = (call: number) =>
  (fetchMock.mock.calls[call][1] as RequestInit).headers as Record<string, string>;

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = API;
  cookie = "XSRF-TOKEN=stale-token";

  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", {
    get cookie() {
      return cookie;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a refused CSRF token", () => {
  it("fetches a fresh token and sends the request once more", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(419, { message: "CSRF token mismatch." }))
      .mockImplementationOnce(async () => {
        cookie = "XSRF-TOKEN=fresh-token";

        return reply(204);
      })
      .mockResolvedValueOnce(reply(200, { message: "Signed in." }));

    const result = await api("/auth/login", {
      method: "POST",
      body: { email: "client@example.test", password: "secret" },
    });

    expect(result).toEqual({ ok: true, status: 200, data: { message: "Signed in." } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example.test/sanctum/csrf-cookie");
    expect(headersOf(0)["X-XSRF-TOKEN"]).toBe("stale-token");
    // The token the re-prime issued, not the one that was refused.
    expect(headersOf(2)["X-XSRF-TOKEN"]).toBe("fresh-token");
    // The same request, body and all.
    expect((fetchMock.mock.calls[2][1] as RequestInit).body).toBe(
      JSON.stringify({ email: "client@example.test", password: "secret" }),
    );
  });

  it("tries only once more, and then says so", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(419, { message: "CSRF token mismatch." }))
      .mockResolvedValueOnce(reply(204))
      .mockResolvedValueOnce(reply(419, { message: "CSRF token mismatch." }));

    const result = await api("/auth/register", { method: "POST", body: {} });

    expect(result).toMatchObject({ ok: false, status: 419, message: "CSRF token mismatch." });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry a read, which carries no token", async () => {
    fetchMock.mockResolvedValueOnce(reply(419, { message: "CSRF token mismatch." }));

    await api("/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry any other refusal", async () => {
    fetchMock.mockResolvedValueOnce(reply(401, { message: "Those credentials do not match our records." }));

    const result = await api("/auth/login", { method: "POST", body: {} });

    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("no token yet", () => {
  it("fetches one before the first mutation", async () => {
    cookie = "";

    fetchMock
      .mockImplementationOnce(async () => {
        cookie = "XSRF-TOKEN=first-token";

        return reply(204);
      })
      .mockResolvedValueOnce(reply(201, { message: "Account created." }));

    await api("/auth/register", { method: "POST", body: {} });

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/sanctum/csrf-cookie");
    expect(headersOf(1)["X-XSRF-TOKEN"]).toBe("first-token");
  });
});
