import "server-only";

import { cookies } from "next/headers";
import type { FormState } from "@/lib/actions/state";

/**
 * The single door to the Laravel API for server-side reads.
 *
 * Every Server Component page and read-only loader goes through here — the
 * wizard's own mutations no longer do (see `lib/api/browser.ts`, which the
 * browser calls directly so its Network tab shows the real request). What
 * remains here is what has to stay server-to-server: rendering a page needs
 * its data before the browser can run any client JS at all.
 *
 *  - The base URL is resolved once, from `API_URL`.
 *  - The credential is Laravel's own Sanctum session cookie, forwarded from
 *    the incoming request. Because cookie domain-matching ignores the port,
 *    the browser already attaches that cookie to requests made to this Next
 *    server (both apps sit on `localhost`) — this module just relays it, plus
 *    the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`, on to Laravel. Nothing here
 *    ever holds a bearer token or talks to NextAuth.
 *  - This is a server-to-server `fetch`, which — unlike a browser's — sends no
 *    `Origin`/`Referer` header on its own. Sanctum's stateful-request check
 *    needs one of those to recognise the forwarded cookie as belonging to our
 *    frontend, so this module supplies `APP_URL` as both. Omitting this is
 *    the classic failure mode: login succeeds, the cookie is set and valid,
 *    and every subsequent server-rendered page still reads as signed out.
 *  - Nothing is cached. Every response here is either user-specific or
 *    security-relevant, and a cached one would eventually be served to the
 *    wrong person.
 *  - Laravel's error envelopes are translated into the `FormState` shape the
 *    forms already consume.
 */

/** Laravel's standard validation envelope. */
type LaravelError = {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
};

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string; code?: string; fieldErrors?: Record<string, string[]>; data?: unknown };

function baseUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error(
      "API_URL is not set. It must point at the Laravel backend, e.g. http://localhost:8000/api/v1",
    );
  }

  return url.replace(/\/+$/, "");
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Plain JSON body. Mutually exclusive with `formData`. */
  body?: unknown;
  /** Multipart body, for file uploads. */
  formData?: FormData;
  /** Forward the caller's session cookie. Off for public endpoints. */
  authenticated?: boolean;
  /** Query string parameters; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
};

/**
 * The incoming request's cookies, relayed to Laravel.
 *
 * `Cookie` carries the whole jar rather than one named cookie: the Sanctum
 * session cookie's name is derived from `APP_NAME` and isn't worth hard-coding
 * here when Laravel already ignores anything it doesn't recognise.
 * `X-XSRF-TOKEN` is read out and decoded separately, per Sanctum's own SPA
 * contract, since the cookie value is URL-encoded but the header must not be.
 */
async function forwardedAuth(): Promise<{ cookieHeader?: string; xsrfHeader?: string }> {
  const jar = await cookies();
  const all = jar.getAll();

  if (all.length === 0) return {};

  const xsrf = jar.get("XSRF-TOKEN")?.value;

  return {
    cookieHeader: all.map((c) => `${c.name}=${c.value}`).join("; "),
    xsrfHeader: xsrf ? decodeURIComponent(xsrf) : undefined,
  };
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${baseUrl()}/${path.replace(/^\/+/, "")}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const {
    method = "GET",
    body,
    formData,
    authenticated = true,
    query,
  } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (authenticated) {
    const { cookieHeader, xsrfHeader } = await forwardedAuth();
    if (cookieHeader) headers.Cookie = cookieHeader;
    if (xsrfHeader) headers["X-XSRF-TOKEN"] = xsrfHeader;

    /*
     * A real browser call always carries an `Origin` header on a cross-origin
     * request, which is how Sanctum's `EnsureFrontendRequestsAreStateful`
     * recognises "this is our frontend, authenticate the session cookie".
     * Node's `fetch` sends neither `Origin` nor `Referer` on its own, so this
     * server-to-server relay has to supply one — otherwise Laravel silently
     * treats the forwarded cookie as an ordinary, unauthenticated request and
     * every SSR read (starting with `GET /me`) comes back as signed-out, no
     * matter how valid the cookie is.
     */
    const frontendOrigin = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
    headers.Origin = frontendOrigin;
    headers.Referer = `${frontendOrigin}/`;
  }

  // Let the runtime set the multipart boundary; setting Content-Type by hand
  // on a FormData body produces a request the server cannot parse.
  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response | undefined;
  let lastError: unknown;

  const url = buildUrl(path, query);
  const requestBody = formData ?? (body === undefined ? undefined : JSON.stringify(body));

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        // Short pause before 1 retry to allow PHP worker pool to free up
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
  }

  if (!response) {
    console.error(`[api] ${method} ${path} could not reach the backend`, lastError);
    return {
      ok: false,
      status: 503,
      message: "We could not reach the service. Please try again shortly.",
      code: "backend_unreachable",
    };
  }

  // 204, or a body that is not JSON at all (a proxy error page, say).
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload ?? {}) as LaravelError;

    return {
      ok: false,
      status: response.status,
      message: error.message ?? "Something went wrong. Please try again.",
      code: error.code,
      fieldErrors: error.errors,
      data: error.data,
    };
  }

  return { ok: true, status: response.status, data: payload as T };
}

/**
 * Unwraps Laravel's `{ data: ... }` envelope for reads.
 *
 * Returns `fallback` rather than throwing. A dashboard panel that cannot load
 * should render empty; taking the whole page down because one section failed is
 * a worse outcome for someone trying to reach their Will.
 */
export async function apiData<T>(
  path: string,
  fallback: T,
  options: RequestOptions = {},
): Promise<T> {
  const result = await api<{ data: T }>(path, options);

  if (!result.ok) {
    console.error(`[api] read failed: ${path} — ${result.message}`);
    return fallback;
  }

  return result.data?.data ?? fallback;
}

/**
 * Runs a mutation and translates the outcome into a `FormState`.
 *
 * This is the adapter that let the backend move without touching the forms:
 * `useActionState` still receives exactly the shape it always did.
 */
export async function apiMutation(
  path: string,
  options: RequestOptions & {
    /** Where to send the browser on success. */
    redirect?: string;
    /** Overrides the backend's success message. */
    successMessage?: string;
    /** Maps a backend `code` to friendlier copy, or to field errors. */
    onError?: (result: Extract<ApiResult<unknown>, { ok: false }>) => FormState | undefined;
  } = {},
): Promise<FormState> {
  const { redirect, successMessage, onError, ...request } = options;

  const result = await api<{ message?: string; data?: Record<string, string> }>(
    path,
    { method: "POST", ...request },
  );

  if (!result.ok) {
    const mapped = onError?.(result);
    if (mapped) return mapped;

    return {
      status: "error",
      message: result.message,
      // Laravel keys validation errors by field path (`executors.0.full_name`),
      // which is the same convention the forms already use.
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    status: "success",
    message: successMessage ?? result.data?.message ?? "",
    data: result.data?.data,
    redirect,
  };
}
