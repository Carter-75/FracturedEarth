'use client';

import { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { NativeBridge } from '@/lib/nativeBridge';

import { useSession, signIn, signOut } from 'next-auth/react';

export function AdBanner() {
  const [adFree, setAdFree] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const settings = localStorage.getItem('fe:user-settings:v1');
    let isAdFree = false;
    if (settings) {
       try {
         const parsed = JSON.parse(settings);
         if (parsed.adFree) isAdFree = true;
       } catch (e) {}
    }
    setAdFree(isAdFree);
    
    document.documentElement.style.setProperty('--header-height', isAdFree ? '0px' : '60px');

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

  if (adFree && status !== 'unauthenticated') return null;

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="fixed top-0 left-0 right-0 h-[60px] z-[1000] bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-2 md:px-4 overflow-hidden group">
        {/* Cinematic Grid + Scanline for the banner area */}
        <div className="absolute inset-0 fe-grid opacity-20" />
        <div className="absolute inset-0 fe-scanline opacity-10" />
        
        {/* Real Ad Content Group */}
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
             <div className="flex items-center space-x-2 text-[var(--fg)] opacity-20 text-[8px] uppercase tracking-tighter">
                <span className="animate-pulse">📡</span> Connection: Secure Sector Ad Link
             </div>
           )}
        </div>

        {/* Persistent Link Actions */}
        <div className="relative z-10 flex items-center gap-1 md:gap-2 pl-2 md:pl-4">
          {status === 'authenticated' ? (
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden lg:inline fe-hologram text-[9px] text-white/40 uppercase tracking-widest italic">{session.user?.name || 'Active_Subject'}</span>
              <button 
                onClick={() => signOut()}
                className="fe-holo-btn !py-1 !px-2 md:!px-3 !text-[8px] md:!text-[10px] !border-rose-500/30 !text-rose-400 hover:!bg-rose-400/10 transition-all uppercase tracking-widest"
              >
                 Exit_Link
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn('google')}
              className="fe-holo-btn !py-1 !px-2 md:!px-3 !text-[8px] md:!text-[10px] !border-[var(--accent)]/50 !text-[var(--accent)] hover:!bg-[var(--accent)]/10 transition-all uppercase tracking-widest"
            >
               Sign_In
            </button>
          )}

          <a 
            href="/store"
            className="fe-holo-btn !py-1 !px-2 md:!px-3 !text-[8px] md:!text-[10px] !border-sky-500/50 !text-sky-400 hover:!bg-sky-400/10 transition-all uppercase tracking-widest"
          >
             Sector Pass
          </a>
        </div>
    </div>
  );
}
