import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="fe-scene bg-black overflow-y-auto sm:overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
         <img src="/assets/type-bgs/chaos.png" className="w-full h-full object-cover opacity-40 scale-105 blur-sm" alt="" />
         <div className="fe-vignette" />
         <div className="fe-scanline" />
         <div className="fe-grid" />
      </div>

      <section className="relative z-10 w-full max-w-7xl px-6 py-20 flex flex-col items-center text-center">
        <div className="fe-flicker mb-12">
           <div className="fe-hologram text-amber-500/60 mb-4 font-black text-xs">Local Area Network Active</div>
           <h1 className="text-[12vw] sm:text-[8rem] font-black italic tracking-tighter text-white leading-none">
             FRACTURED<br/>
             <span className="text-amber-500">EARTH</span>
           </h1>
        </div>

        <p className="max-w-2xl text-lg sm:text-2xl text-white/50 font-light tracking-tight mb-16 px-4">
          Experience the definitive strategic survival engine. Secure your sector and manage your resources in pure cinematic reality.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mt-8">
           <Link href="/lan" className="fe-holo-btn flex-1 !py-5 !text-lg !text-white !bg-amber-500/10 !border-amber-500/30 hover:!bg-amber-500/20 active:scale-95 transition-all">
             Start Protocol
           </Link>
           <Link href="/tutorial" className="fe-holo-btn flex-1 !py-5 !text-lg active:scale-95 transition-all">
             Training
           </Link>
           <Link href="/rules" className="fe-holo-btn flex-1 !py-5 !text-lg !border-sky-500/50 !text-sky-400 active:scale-95 transition-all">
             NeuralAtlas
           </Link>
        </div>
        
        <Link href="/settings" className="mt-8 text-white/20 hover:text-white/60 text-xs tracking-[0.5em] transition-all uppercase">
          Access_Settings
        </Link>
      </section>

      {/* Floating Decorative Mesh */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] border border-white/5 rounded-full blur-3xl bg-amber-500/5 pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] border border-white/5 rounded-full blur-3xl bg-sky-500/5 pointer-events-none" />
    </main>
  );
}
