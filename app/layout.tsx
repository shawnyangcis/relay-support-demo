import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Manrope({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Relay — thoughtful support, demonstrated",
  description:
    "Try a working support assistant: source-backed answers, guided troubleshooting, and a thoughtful handoff. A demo with fictional Northstar content.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
