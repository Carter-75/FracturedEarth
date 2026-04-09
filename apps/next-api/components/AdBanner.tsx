'use client';

import { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { NativeBridge } from '@/lib/nativeBridge';

import { useSession, signIn, signOut } from 'next-auth/react';

export function AdBanner() {
  const [adFree, setAdFree] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setHasMounted(true);
    const settings = localStorage.getItem('fe:user-settings:v1');
    let isAdFree = false;
    if (settings) {
       try {
         const parsed = JSON.parse(settings);
         if (parsed.adFree) isAdFree = true;
       } catch (e) {}
    }
    setAdFree(isAdFree);
    
    // Header height is already handled in globals.css/layout.root for safe areas
    // but we can toggle visibility here if needed.

    // Show real AdMob banner if on native app
    const adId = NativeBridge.getAdUnitId('banner');
    if (!isAdFree && adId) {
      AdMob.showBanner({
        adId, 
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
      }).catch(e => console.error('Failed to show native banner', e));
    }

    // Initialize Web AdSense if not native
    if (!isAdFree && !Capacitor.isNativePlatform()) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (e) {
        console.error('AdSense error', e);
      }
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
         AdMob.removeBanner().catch(() => {});
      }
    };
  }, []);

  if (!hasMounted) return null;
  if (adFree && status !== 'unauthenticated') return null;

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="fixed top-0 left-0 right-0 h-[var(--header-height)] z-[1000] bg-surface/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 overflow-hidden group transition-all duration-500">
        {/* Cinematic Layering */}
        <div className="absolute inset-0 fe-scanline opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent-alt/5 pointer-events-none" />
        
        {/* Ad Content Group */}
        <div className="relative flex-1 flex items-center h-full">
           {!isNative && !adFree && process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID && (
             <ins className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '50px' }}
                  data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID}
                  data-ad-slot="auto"
                  data-ad-format="horizontal"
                  data-full-width-responsive="true"></ins>
           )}
           {isNative && !adFree && (
             <div className="flex items-center gap-2 text-fg-subtle/30 text-[8px] uppercase tracking-tighter">
                <span className="animate-pulse">🛰️</span> Neural_Link_Stabilizer: Active
             </div>
           )}
        </div>

        {/* Global Action Bar */}
        <div className="relative z-10 flex items-center gap-2 pl-4">
          {status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline fe-hologram text-[8px] text-fg-subtle/60 uppercase italic tracking-widest">{session.user?.name}</span>
              <button 
                onClick={() => signOut()}
                className="fe-btn !py-1.5 !px-3 !text-[8px] !border-danger/10 !text-danger/40 hover:!text-danger transition-all font-black"
              >
                 Exit_Link
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn('google')}
              className="fe-btn !py-1.5 !px-3 !text-[8px] !border-accent/10 !text-accent/60 hover:!text-accent transition-all font-black"
            >
               Sign_In
            </button>
          )}

          <a 
            href="/store"
            className="fe-btn !py-1.5 !px-3 !text-[8px] !border-accent-alt/10 !text-accent-alt/60 hover:!text-accent-alt transition-all font-black"
          >
             Sector_Pass
          </a>
        </div>
    </div>
  );
}
