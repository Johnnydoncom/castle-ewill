import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { COMPANY } from "@/lib/company";

/**
 * Fonts are self-hosted through `next/font` rather than a `<link>` to Google.
 * This removes a render-blocking third-party request, eliminates the layout
 * shift on first paint, and keeps requests off Google's servers at runtime —
 * which matters for a product making privacy commitments.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});

const title = `${COMPANY.name} — Nigeria's Premium Online Will Platform`;
const description =
  "Write your own Will online, in compliance with Nigerian law. Draft it, print it, and add a solicitor's review only if you want one.";

/**
 * The site's own origin, as metadata should state it.
 *
 * Falls back to the live host rather than to localhost: a production build
 * that forgot the variable is better off naming the real site than naming a
 * developer's laptop.
 */
function siteUrl(): URL {
  const configured = process.env.APP_URL?.trim() || "https://castlewilltrust.com";
  const url = new URL(configured);

  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    url.protocol = "https:";
  }

  return url;
}

export const metadata: Metadata = {
  /*
   * Every relative URL in the metadata below — and every `alternates.canonical`
   * on a page — is resolved against this, so wrong here is wrong sitewide.
   *
   * Two things it guards against, both observed in production:
   *
   *  - **An unset `APP_URL`**, which used to leave `http://localhost:3000` on
   *    the og:image of a live page.
   *  - **An `http://` one.** `APP_URL` was set to `http://castlewilltrust.com`,
   *    so the site advertised an insecure og:image — which several platforms
   *    decline to fetch — and would have advertised insecure canonicals too,
   *    pointing every page at a URL that only redirects. The scheme is upgraded
   *    for anything that is not localhost, because a site served over TLS has
   *    no honest reason to name itself over plaintext.
   */
  metadataBase: siteUrl(),
  title: {
    template: `%s — ${COMPANY.name}`,
    default: title,
  },
  description,
  /*
   * **No `alternates` here on purpose.** Metadata `alternates` is inherited
   * rather than merged, so a canonical set on this layout would be adopted by
   * every page that does not override it — declaring the entire site a
   * duplicate of the homepage. Each public page carries its own.
   */
  openGraph: {
    title,
    description,
    type: "website",
    siteName: COMPANY.name,
    images: [
      {
        url: "/images/hero-family.jpg",
        width: 1200,
        height: 630,
        alt: COMPANY.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/hero-family.jpg"],
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
