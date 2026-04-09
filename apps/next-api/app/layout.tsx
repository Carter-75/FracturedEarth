import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { TutorialLaunchGate } from '@/components/TutorialLaunchGate';
import { AdBanner } from '@/components/AdBanner';
import { SectorPassPopup } from '@/components/SectorPassPopup';
import { Analytics } from '@vercel/analytics/next';
import React from 'react';

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-geometric',
  weight: ['300', '400', '500', '600', '700', '800', '900'] 
});

export const metadata: Metadata = {
  title: 'Fractured Earth',
  description: 'A chaos survival card game — build your civilization, survive the apocalypse.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020305',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} dark`}>
      <head>
        {(process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID && 
          process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID !== 'ca-pub-0000000000000000') && (
          <script 
            async 
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <Providers>
          <div className="fe-layout-root">
            <AdBanner />
            <TutorialLaunchGate />
            <SectorPassPopup />
            <div className="fe-content-scroll">
              {children}
            </div>
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
