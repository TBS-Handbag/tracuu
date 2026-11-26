import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

// Self-hosted at build time, no request to Google Fonts at runtime.
const font = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700', '800'], variable: '--font-sans' });

export const metadata: Metadata = { title: 'Tra mẫu' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
