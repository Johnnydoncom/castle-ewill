import type { FormState } from "@/lib/actions/state";

/**
 * The browser's door to the Laravel API.
 *
 * Every mutation the user performs — sign in, save a wizard step, upload a
 * document, start a checkout — goes straight from this module to Laravel
 * (`NEXT_PUBLIC_API_URL`), not through a Next.js server action or route
 * handler. That is deliberate: it is the only way the browser's Network tab
 * shows what the backend actually received and returned.
 *
 * Authentication is Sanctum's SPA cookie session, not a bearer token:
 *
 *  - `credentials: "include"` on every request, so the httpOnly session
 *    cookie Laravel set at sign-in is sent back automatically. Nothing here
 *    ever reads or stores a credential — there is none for JS to reach.
 *  - Before the first mutating request, `/sanctum/csrf-cookie` is fetched to
 *    prime the (non-httpOnly, by design) `XSRF-TOKEN` cookie, whose value is
 *    then echoed back as `X-XSRF-TOKEN` on every state-changing request, per
 *    Sanctum's own SPA authentication contract.
 *  - `readCookie`/`ensureCsrfCookie` no-op when `document` is undefined —
 *    this module is safe to import from a Server Component (an unauthenticated
 *    call like email-token verification runs as a plain server-to-server
 *    fetch instead, which Sanctum never treats as a stateful request anyway,
 *    since it carries no browser Origin header).
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

function apiBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. It must point at the Laravel backend, e.g. http://localhost:8000/api/v1",
    );
  }

  return url.replace(/\/+$/, "");
}

/**
 * `/sanctum/csrf-cookie` lives at the backend's app root, not under `/api/v1`
 * — but "root" means whatever sits in front of `/api/v1` in `apiBase()`, not
 * necessarily the bare origin. When `NEXT_PUBLIC_API_URL` is routed through a
 * same-origin rewrite (e.g. `http://localhost:3000/backend/api/v1`, so the
 * browser gets a same-site cookie from a remotely-hosted API during local
 * development), stripping down to `.origin` would drop the `/backend` prefix
 * and the csrf-cookie request would miss the rewrite entirely.
 */
function apiRoot(): string {
  return apiBase().replace(/\/api\/v\d+\/?$/, "");
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Asks Sanctum for a fresh `XSRF-TOKEN` cookie, whatever is already set. */
async function primeCsrfCookie(): Promise<void> {
  if (typeof document === "undefined") return;

  await fetch(`${apiRoot()}/sanctum/csrf-cookie`, {
    credentials: "include",
    cache: "no-store",
  });
}

async function ensureCsrfCookie(): Promise<void> {
  if (typeof document === "undefined") return;
  if (readCookie("XSRF-TOKEN")) return;

  await primeCsrfCookie();
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Plain JSON body. Mutually exclusive with `formData`. */
  body?: unknown;
  /** Multipart body, for file uploads. */
  formData?: FormData;
  /** Query string parameters; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${apiBase()}/${path.replace(/^\/+/, "")}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body, formData, query } = options;

  const mutating = MUTATING_METHODS.has(method);

  if (mutating) await ensureCsrfCookie();

  const url = buildUrl(path, query);
  const requestBody = formData ?? (body === undefined ? undefined : JSON.stringify(body));

  /*
   * Headers are built per send, not once: a retry after a 419 has to carry the
   * token the re-prime just issued, not the one that was refused.
   */
  const send = async (): Promise<{ response?: Response; error?: unknown }> => {
    const headers: Record<string, string> = { Accept: "application/json" };

    if (mutating) {
      const xsrf = readCookie("XSRF-TOKEN");
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
    }

    // Let the runtime set the multipart boundary; setting Content-Type by hand
    // on a FormData body produces a request the server cannot parse.
    if (body !== undefined && !formData) {
      headers["Content-Type"] = "application/json";
    }

    let error: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return {
          response: await fetch(url, {
            method,
            headers,
            body: requestBody,
            credentials: "include",
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          }),
        };
      } catch (caught) {
        error = caught;
        if (attempt === 0) {
          // Short pause before 1 retry to allow PHP worker pool to free up.
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
    }

    return { error };
  };

  let { response, error: lastError } = await send();

  /*
   * A refused CSRF token, re-primed once.
   *
   * `ensureCsrfCookie()` only fetches a token when there is none. But a token
   * can outlive the server session it belongs to — the session expires, or is
   * cleared — and Laravel's 419 then issues a new session cookie *without* a new
   * `XSRF-TOKEN`. Left alone, the browser sends the same stale token on every
   * attempt and nobody can sign in or register until that cookie expires. So a
   * 419 on a mutation fetches a fresh token and sends the request once more.
   */
  if (response?.status === 419 && mutating && typeof document !== "undefined") {
    await primeCsrfCookie();

    ({ response, error: lastError } = await send());
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
 * Runs a mutation and translates the outcome into a `FormState`.
 *
 * The same adapter shape as the server-side `apiMutation` in
 * `lib/api/client.ts`, so a form's `useFormAction` binding does not change
 * when the underlying action switches from a server call to this one.
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
