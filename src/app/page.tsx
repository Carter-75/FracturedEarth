'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="fe-scene bg-black overflow-y-auto sm:overflow-hidden !justify-start md:!justify-center !items-start">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
         <img src="/assets/type-bgs/chaos.png" className="w-full h-full object-cover opacity-40 scale-105 blur-sm" alt="" />
         <div className="fe-vignette" />
         <div className="fe-scanline" />
         <div className="fe-grid" />
      </div>

      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-24 pb-12 md:py-32 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="fe-flicker mb-8 md:mb-12">
           <div className="fe-hologram text-[var(--accent)] opacity-60 mb-4 font-black text-[10px] md:text-xs">Local Area Network Active</div>
           <h1 className="text-[15vw] md:text-[8rem] font-black italic tracking-tighter text-[var(--fg)] leading-[0.9] md:leading-none">
             FRACTURED<br/>
             <span className="text-[var(--accent)]">EARTH</span>
           </h1>
        </div>

        <p className="max-w-2xl text-base md:text-2xl text-[var(--fg)] opacity-50 font-light tracking-tight mb-12 md:mb-16 px-4 leading-relaxed">
          Experience the definitive strategic survival engine. Secure your sector and manage your resources in pure cinematic reality.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl mt-8 px-4">
           <Link href="/lan" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg !text-[var(--fg)] !bg-[var(--accent)]/10 !border-[var(--accent)]/30 hover:!bg-[var(--accent)]/20">
             Start Protocol
           </Link>
           <Link href="/tutorial" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg">
             Training
           </Link>
           <Link href="/rules" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg !border-[var(--accent-soft)]/50 !text-[var(--accent-soft)]">
             NeuralAtlas
           </Link>
        </div>
        
        <Link href="/settings" className="mt-8 text-[var(--fg)] opacity-20 hover:opacity-60 text-xs tracking-[0.5em] transition-all uppercase">
          Access_Settings
        </Link>
      </section>

      {/* Floating Decorative Mesh */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] border border-white/5 rounded-full blur-3xl bg-[var(--accent)]/5 pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] border border-white/5 rounded-full blur-3xl bg-[var(--accent-soft)]/5 pointer-events-none" />
    </main>
  );
}
