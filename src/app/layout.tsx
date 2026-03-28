import type { Metadata } from 'next';
import { Cinzel, Spectral } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { TutorialLaunchGate } from '@/components/TutorialLaunchGate';
import { AdBanner } from '@/components/AdBanner';
import { SectorPassPopup } from '@/components/SectorPassPopup';
import { Analytics } from '@vercel/analytics/next';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });
const spectral = Spectral({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Fractured Earth',
  description: 'A chaos survival card game — build your civilization, survive the apocalypse.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'Fractured Earth',
    description: 'A chaos survival card game',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${spectral.variable}`}>
      <body>
        <Providers>
          <AdBanner />
          <TutorialLaunchGate />
          <SectorPassPopup />
          <div className="pt-[60px] h-screen overflow-hidden flex flex-col">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
