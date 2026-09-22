import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/home.css";
import "@/styles/shell.css";
import "@/styles/community.css";

export const metadata: Metadata = {
  title: {
    default: "BITCAT — Still here. Still Bitcat.",
    template: "%s · BITCAT",
  },
  description:
    "An independent home for Bitcat, built by one holder. Play Flap, make a meme, explore live data, and help build the next chapter.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/bitcat-pfp.jpg",
  },
  openGraph: {
    type: "website",
    title: "BITCAT — Still here. Still Bitcat.",
    description:
      "One holder is still building. Play a round, make something ridiculous, and explore Bitcat on BNB Chain.",
    images: [{ url: "https://bitcatbnb.family/assets/bitcat-banner.jpg", alt: "Bitcat with Bitcoin artwork" }],
  },
  twitter: {
    card: "summary",
    title: "BITCAT — Still here. Still Bitcat.",
    description: "Play Flap, make a meme, and follow what one holder is building next.",
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
