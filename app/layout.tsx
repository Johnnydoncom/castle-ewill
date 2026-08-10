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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    template: `%s — ${COMPANY.name}`,
    default: title,
  },
  description,
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
