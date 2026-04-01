'use client';

import { useEffect, useState } from 'react';

/**
 * AdBanner component reserves a 60px space at the top of the screen.
 * On Web: Shows a high-fidelity placeholder (AdSense simulation).
 * On App: Represents the space occupied by the native AdMob banner.
 */
export function AdBanner() {
  const [adFree, setAdFree] = useState(false);

  useEffect(() => {
    // Check local storage for ad-free entitlement
    const settings = localStorage.getItem('fe:user-settings:v1');
    let isAdFree = false;
    if (settings) {
       try {
         const parsed = JSON.parse(settings);
         if (parsed.adFree) isAdFree = true;
       } catch (e) {}
    }
    setAdFree(isAdFree);
    
    // Set global CSS variable for layout padding
    document.documentElement.style.setProperty('--header-height', isAdFree ? '0px' : '60px');
  }, []);

  if (adFree) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[60px] z-[1000] bg-black border-b border-white/5 flex items-center justify-center overflow-hidden">
        {/* Cinematic Grid + Scanline for the banner area */}
        <div className="absolute inset-0 fe-grid opacity-20" />
        <div className="absolute inset-0 fe-scanline opacity-10" />
        
        <div className="relative flex items-center space-x-3 px-4 py-1 rounded-full border border-sky-400/20 bg-sky-400/5">
           <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
           <span className="fe-hologram text-sky-400 text-[9px] uppercase font-bold tracking-[0.2em]">
              Sponsor Signal Active: Interstellar Transmission 0x4B
           </span>
        </div>

        {/* This is where AdSense or a native bridge would inject the actual ad */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/80 cursor-pointer">
           <span className="fe-hologram text-white text-[10px] uppercase font-black tracking-widest">Remove Ads with Sector Pass</span>
        </div>
    </div>
  );
}
