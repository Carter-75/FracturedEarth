'use client';

import { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { NativeBridge } from '@/lib/nativeBridge';

export function AdBanner() {
  const [adFree, setAdFree] = useState(false);

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

    return () => {
      if (Capacitor.isNativePlatform()) {
         AdMob.removeBanner().catch(() => {});
      }
    };
  }, []);

  if (adFree) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[60px] z-[1000] bg-black border-b border-white/5 flex items-center justify-between px-4 overflow-hidden group">
        {/* Cinematic Grid + Scanline for the banner area */}
        <div className="absolute inset-0 fe-grid opacity-20" />
        <div className="absolute inset-0 fe-scanline opacity-10" />
        
        {/* Simulated "Real" Ad Content */}
        <div className="relative flex items-center space-x-4">
           <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🏔️</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest leading-none">Mount_Titan_Outpost</span>
              <span className="text-[8px] text-white/40 uppercase tracking-tighter mt-1 italic">Equipment for the serious candidate. Limited Stock.</span>
           </div>
        </div>

        {/* Persistent Sector Pass Link */}
        <a 
          href="/store"
          className="relative z-10 fe-holo-btn !py-1 !px-3 !text-[8px] md:!text-[10px] !border-sky-500/50 !text-sky-400 hover:!bg-sky-400/10 transition-all uppercase tracking-widest"
        >
           Sector Pass
        </a>
    </div>
  );
}
