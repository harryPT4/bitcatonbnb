import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/home.css";
import "@/styles/shell.css";

export const metadata: Metadata = {
  title: {
    default: "BITCAT — The Bitcoin-Paying Cat on BNB Chain",
    template: "%s · BITCAT",
  },
  description:
    "Meet BITCAT, the community-run Bitcoin Cat on BNB Chain. Explore its on-chain BTCB dividend vault, live market data, rewards calculator, and games.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/bitcat-pfp.jpg",
  },
  openGraph: {
    type: "website",
    title: "BITCAT — The cat that pays you Bitcoin",
    description:
      "A community-run BNB Chain token with an on-chain BTCB dividend vault, live data, and community games.",
  },
  twitter: {
    card: "summary",
    title: "BITCAT — The cat that pays you Bitcoin",
    description: "Live BTCB rewards, on-chain receipts, and community games.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0908" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Kept external during the compatibility migration; all routes share this root layout. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        <Script src="/scripts/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
