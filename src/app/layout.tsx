import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { TutorialLaunchGate } from '@/components/TutorialLaunchGate';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Fractured Earth',
  description: 'A chaos survival card game — build your civilization, survive the apocalypse.',
  openGraph: {
    title: 'Fractured Earth',
    description: 'A chaos survival card game',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <TutorialLaunchGate />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
