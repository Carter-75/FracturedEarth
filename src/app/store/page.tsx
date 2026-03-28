'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PACKAGES = [
  {
    id: 'monthly',
    name: 'Standard Sync',
    duration: 'Monthly',
    price: '$3.99',
    perks: ['Ad-Free Sector', 'Priority Link', 'Basic PIPS'],
    glow: 'sky',
  },
  {
    id: 'yearly',
    name: 'Strategic Pulse',
    duration: 'Yearly',
    price: '$39.99',
    perks: ['Ad-Free Sector', 'Neural Atlas Access', 'Custom PIPS', '15% Efficiency'],
    glow: 'amber',
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Eternal Protocol',
    duration: 'Lifetime',
    price: '$49.99',
    perks: ['Never See Ads Again', 'All Themes Unlocked', 'Founding Candidate Badge', 'Legacy Vault'],
    glow: 'emerald',
  },
];

export default function StorePage() {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    // Basic detection for WebView/App (can be refined with a bridge check)
    if (typeof window !== 'undefined' && (window as any).Android) {
       setIsApp(true);
    }
  }, []);

  return (
    <main className="fe-scene bg-black overflow-y-auto flex flex-col items-center py-20 px-6">
      <div className="absolute inset-0 z-0">
         <img src="/assets/type-bgs/ascended.png" className="w-full h-full object-cover opacity-20 blur-3xl scale-125" alt="" />
         <div className="fe-vignette" />
         <div className="fe-grid opacity-10" />
      </div>

      <header className="relative z-10 text-center mb-16">
         <div className="fe-hologram text-sky-400 mb-4 font-black tracking-[0.3em] uppercase text-xs">Sector Security Center</div>
         <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-white uppercase">Sector<span className="text-sky-400">Pass</span></h1>
         <p className="max-w-xl mx-auto text-white/40 mt-6 font-light">
            Eliminate sponsor interference and stabilize your planetary simulation with a high-bandwidth Sector Pass.
         </p>
      </header>

      <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-3 gap-8 mb-20">
         {PACKAGES.map((pkg, idx) => (
            <motion.div 
               key={pkg.id}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className={`relative group bg-[#0a0c0f]/80 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl flex flex-col items-center text-center transition-all hover:border-${pkg.glow}-500/50`}
            >
               {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Recommended</div>
               )}
               
               <div className={`fe-blur-bg bg-${pkg.glow}-500/5`} />
               
               <div className="fe-hologram text-[10px] text-white/30 uppercase mb-2">{pkg.duration}</div>
               <h3 className="text-2xl font-black text-white italic mb-4 uppercase">{pkg.name}</h3>
               <div className="text-5xl font-black text-white mb-8 tracking-tighter">{pkg.price}</div>
               
               <ul className="w-full space-y-4 mb-10 text-left">
                  {pkg.perks.map(perk => (
                     <li key={perk} className="flex items-start space-x-3 text-sm text-white/50 group-hover:text-white/80 transition-colors">
                        <span className={`w-1.5 h-1.5 mt-1.5 rounded-full bg-${pkg.glow}-500`} />
                        <span>{perk}</span>
                     </li>
                  ))}
               </ul>

               {isApp ? (
                  <button className={`fe-holo-btn w-full !py-4 !border-${pkg.glow}-500/50 !text-white hover:!bg-${pkg.glow}-500/10`}>
                     Initialize Purchase
                  </button>
               ) : (
                  <div className="w-full space-y-4">
                     <button disabled className="fe-holo-btn w-full !py-4 !bg-white/5 !text-white/20 !cursor-not-allowed">Web Link Restricted</button>
                     <p className="text-[10px] fe-hologram text-white/20 uppercase tracking-widest">Download Android App to Purchase</p>
                  </div>
               )}
            </motion.div>
         ))}
      </div>

      <Link href="/lan" className="relative z-10 fe-hologram text-white/20 hover:text-white transition-all text-xs tracking-[0.4em] font-black uppercase">← Back to Terminal</Link>
    </main>
  );
}
