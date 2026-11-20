import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Relay — thoughtful support, demonstrated',
  description: 'Try a working support assistant: source-backed answers, guided troubleshooting, and a thoughtful handoff. A demo with fictional Northstar content.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
