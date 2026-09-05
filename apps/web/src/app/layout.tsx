import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const displayFont = localFont({
  src: "./fonts/OrbitDisplay.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

const bodyFont = localFont({
  src: [
    { path: "./fonts/NunitoSansLatin.woff2", weight: "200 1000" },
    { path: "./fonts/NunitoSansCyrillic.woff2", weight: "200 1000" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Veylo", template: "%s · Veylo" },
  description: "Your playful workspace for IELTS Academic preparation",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
