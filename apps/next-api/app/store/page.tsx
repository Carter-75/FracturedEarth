'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { NativeBridge } from '@/lib/nativeBridge';
import { useSubscription } from '@/lib/SubscriptionProvider';

const PACKAGES = [
  {
    id: 'monthly',
    rcId: 'monthly_standard',
    name: 'Monthly Sync',
    duration: 'Monthly',
    price: '$3.99',
    perks: ['Ad-Free Sector', 'Priority Link', 'Basic PIPS'],
    glow: 'sky',
  },
  {
    id: 'yearly',
    rcId: 'yearly_strategic',
    name: 'Yearly Strategic',
    duration: 'Yearly',
    price: '$39.99',
    perks: ['Ad-Free Sector', 'Neural Atlas Access', 'Custom PIPS', '15% Efficiency'],
    glow: 'amber',
    popular: true,
  },
  {
    id: 'lifetime',
    rcId: 'lifetime_eternal',
    name: 'Eternal Lifetime',
    duration: 'Lifetime',
    price: '$49.99',
    perks: ['Never See Ads Again', 'All Themes Unlocked', 'Founding Candidate Badge', 'Legacy Vault'],
    glow: 'emerald',
  },
];

export default function StorePage() {
  const { adFree, isLifetime, refreshEntitlements } = useSubscription();
  const [loading, setLoading] = useState(false);
  const isNative = NativeBridge.isNative;

  async function handlePurchase(pkg: (typeof PACKAGES)[number]) {
    if (!isNative) {
      alert('In-App Purchases are exclusive to the Fractured Earth App. Please download the app from the Play Store or App Store to upgrade your sector.');
      return;
    }

    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const entitlementId = pkg.id === 'lifetime' ? 'eternal_protocol' : 'ad_free';
      
      // Upgrade/Downgrade logic note: RevenueCat handles this via ProrationMode on Android
      // Here we just initiate the purchase of the selected package.
      const rcPackage = offerings.current?.availablePackages.find(p => p.identifier.includes(pkg.id));
      
      if (rcPackage) {
        await Purchases.purchasePackage({ aPackage: rcPackage });
        await refreshEntitlements();
        alert('Transmission Successful: Entitlements Synced.');
      } else {
        alert('Purchase Interface Unavailable: Offline Sync Mode.');
      }

    } catch (e: any) {
      if (!e.userCancelled) {
        alert('Transaction Failed: Neural Link Interrupted.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Determine if a button should be disabled based on ownership logic
  const getButtonState = (pkgId: string) => {
    if (isLifetime) return { disabled: true, label: 'Lifetime Active' };
    
    // If they have adFree (Monthly/Yearly) and they are trying to buy another Monthly/Yearly?
    // RevenueCat usually handles the 'already owned' state, but we can reflect it.
    if (adFree && pkgId === 'monthly') return { disabled: true, label: 'Subscription Active' };
    
    return { disabled: false, label: isNative ? 'Initialize Sync' : 'App Required' };
  };

  return (
    <main className="fe-scene bg-black overflow-y-auto flex flex-col items-center py-20 px-6">
      <div className="absolute inset-0 z-0 text-white/50">
         <Image src="/assets/type-bgs/ascended.png" fill className="object-cover opacity-20 blur-3xl scale-125" alt="" unoptimized />
         <div className="fe-vignette" />
         <div className="fe-grid opacity-10" />
      </div>

      {!isNative && (
         <div className="relative z-20 w-full max-w-lg mb-12 p-6 rounded-2xl bg-accent/10 border border-accent/20 backdrop-blur-3xl text-center">
            <div className="fe-hologram text-accent text-[10px] font-black tracking-widest mb-2 animate-pulse">Platform Restriction Detected</div>
            <p className="text-[10px] text-fg/60 uppercase tracking-widest leading-relaxed">
               Sector Pass acquisitions are restricted to the mobile client. Sign in to your account here to sync your mobile purchases.
            </p>
         </div>
      )}

      <header className="relative z-10 text-center mb-16">
         <div className="fe-hologram text-sky-400 mb-4 font-black tracking-[0.3em] uppercase text-xs">Sector Security Center</div>
         <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-white uppercase">Sector<span className="text-sky-400">Pass</span></h1>
      </header>

      <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-3 gap-8 mb-20 px-4">
         {PACKAGES.map((pkg, idx) => {
            const state = getButtonState(pkg.id);
            const isOwned = (pkg.id === 'lifetime' && isLifetime) || (pkg.id !== 'lifetime' && adFree && !isLifetime);

            return (
               <motion.div 
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative group bg-[#0a0c0f]/80 border ${isOwned ? 'border-sky-500/50' : 'border-white/10'} rounded-[2.5rem] p-10 backdrop-blur-3xl flex flex-col items-center text-center transition-all hover:border-sky-500/50`}
               >
                  {pkg.popular && !adFree && (
                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Best Value</div>
                  )}
                  
                  <div className="fe-hologram text-[10px] text-white/30 uppercase mb-2">{pkg.duration}</div>
                  <h3 className="text-2xl font-black text-white italic mb-4 uppercase">{pkg.name}</h3>
                  <div className="text-5xl font-black text-white mb-8 tracking-tighter">{pkg.price}</div>
                  
                  <ul className="w-full space-y-4 mb-10 text-left">
                     {pkg.perks.map(perk => (
                        <li key={perk} className="flex items-start space-x-3 text-sm text-white/50 group-hover:text-white/80 transition-colors">
                           <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-sky-500" />
                           <span>{perk}</span>
                        </li>
                     ))}
                  </ul>

                  <button 
                     disabled={loading || state.disabled || (pkg.id !== 'lifetime' && isLifetime)}
                     onClick={() => handlePurchase(pkg)}
                     className={`fe-holo-btn w-full !py-4 transition-all ${
                        isOwned 
                        ? '!border-sky-500/20 !bg-sky-500/10 !text-sky-400' 
                        : (state.disabled || (pkg.id !== 'lifetime' && isLifetime))
                           ? 'opacity-20 !cursor-not-allowed !grayscale' 
                           : '!border-sky-500/50 !text-white hover:!bg-sky-500/10'
                     }`}
                  >
                     {loading ? 'Transmitting...' : isOwned ? 'Protocol Active' : state.label}
                  </button>
               </motion.div>
            );
         })}
      </div>

      <Link href="/lan" className="relative z-10 fe-hologram text-white/20 hover:text-white transition-all text-xs tracking-[0.4em] font-black uppercase">← Back to Terminal</Link>
   </main>
  );
}
