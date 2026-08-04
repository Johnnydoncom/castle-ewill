import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  /*
   * Local-dev-only same-origin proxy to a remote backend.
   *
   * `NEXT_PUBLIC_API_URL` normally points at a backend on the same host as
   * the frontend (both on `localhost`, or both on subdomains of one parent
   * domain in production) — RFC 6265 cookie matching ignores the port, and
   * subdomains of one registrable domain are "same-site", so the Sanctum
   * session cookie is visible everywhere it needs to be with no proxy at
   * all. That breaks down only when testing a local frontend against an
   * already-deployed backend on a genuinely different domain (e.g.
   * `api.castlewilltrust.com`): a cookie set for that host is never sent to
   * `localhost:3000`, so the Next server has nothing to forward for
   * server-rendered pages, even though the browser's own direct calls work
   * fine. Routing everything through this rewrite makes the browser see one
   * origin (`localhost:3000`) the whole time, so the cookie ends up
   * host-only for `localhost` — exactly the case the port-only trick
   * already handles. Remove this, and point `NEXT_PUBLIC_API_URL` straight
   * at the backend again, once the frontend has its own real deployment.
   */
  async rewrites() {
    const backendRoot = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
      .replace(/\/api\/v\d+\/?$/, "");

    if (!backendRoot) return [];

    return [{ source: "/backend/:path*", destination: `${backendRoot}/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            /*
             * `camera=(self)`, not `camera=()`.
             *
             * An empty allow-list denies every origin *including our own*, which
             * silently breaks the liveness check — `getUserMedia` rejects and
             * the user is told their camera was refused, with nothing in the
             * browser settings to change. Microphone and geolocation stay fully
             * denied because nothing here asks for them.
             *
             * Matches the header the API sends on its own responses.
             */
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
