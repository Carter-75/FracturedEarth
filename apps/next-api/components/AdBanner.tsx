'use client';

import { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { NativeBridge } from '@/lib/nativeBridge';
import { useSubscription } from '@/lib/SubscriptionProvider';
import Link from 'next/link';

import { useSession, signIn, signOut } from 'next-auth/react';

export function AdBanner() {
  const { adFree } = useSubscription();
  const [hasMounted, setHasMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setHasMounted(true);
    
    // Show real AdMob banner if on native app and NOT ad-free
    const adId = NativeBridge.getAdUnitId('banner');
    if (!adFree && adId) {
      AdMob.showBanner({
        adId, 
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
      }).catch(e => console.error('Failed to show native banner', e));
    }

    // Initialize Web AdSense if not native and NOT ad-free
    if (!adFree && !Capacitor.isNativePlatform()) {
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
  }, [adFree]); // Re-run if ad-free status changes (e.g. after purchase)

  if (!hasMounted) return null;

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="fixed top-0 left-0 right-0 h-[var(--header-height)] z-[1000] bg-surface/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 sm:px-4 overflow-hidden group transition-all duration-500">
        {/* Cinematic Layering */}
        <div className="absolute inset-0 fe-scanline opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent-alt/5 pointer-events-none" />
        
        {/* Ad Content Group */}
        <div className="relative flex-1 flex items-center h-full">
           {!isNative && !adFree && process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID && (
             <ins className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '40px' }}
                  data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_BANNER_ID}
                  data-ad-slot="auto"
                  data-ad-format="horizontal"
                  data-full-width-responsive="true"></ins>
           )}
           {(isNative || adFree) && (
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${adFree ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]'}`} />
                <div className="flex flex-col">
                   <span className="fe-hologram text-[7px] text-accent/60 uppercase tracking-[0.2em] font-black leading-none">
                      {adFree ? 'Eternal_Link_Stabilized' : 'Neural_Link_Stabilizer'}
                   </span>
                   <span className="text-[5px] text-fg/20 uppercase tracking-[0.4em] font-black mt-0.5 leading-none">
                      {adFree ? 'Sponsor Interference Nullified' : 'Signal_Strength: Optimized'}
                   </span>
                </div>
             </div>
           )}
        </div>

        {/* Global Action Bar */}
        <div className="relative z-10 flex items-center gap-1.5 pl-2">
          {status === 'authenticated' ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline fe-hologram text-[7px] text-fg-subtle/60 uppercase italic tracking-widest">{session.user?.name}</span>
              <button 
                onClick={() => signOut()}
                className="fe-btn !py-1 !px-2 !text-[7px] !border-danger/10 !text-danger/40 hover:!text-danger transition-all font-black"
              >
                 Exit_Link
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn('google')}
              className="fe-btn !py-1 !px-2 !text-[7px] !border-accent/10 !text-accent/60 hover:!text-accent transition-all font-black uppercase"
            >
               Sign_In
            </button>
          )}

          <Link 
            href="/store"
            className="fe-btn !py-1 !px-2 !text-[7px] !border-accent-alt/20 !text-accent-alt/60 hover:!text-accent-alt transition-all font-black uppercase whitespace-nowrap"
          >
             Pass_Link
          </Link>
        </div>
    </div>
  );
}
