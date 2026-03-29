import Link from 'next/link';

export default function RulesPage() {
  return (
    <main className="fe-scene bg-black overflow-y-auto">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 h-full">
         <img src="/assets/type-bgs/ascended.png" className="w-full h-full object-cover opacity-10 blur-3xl scale-125" alt="" />
         <div className="fe-vignette h-full" />
         <div className="fe-scanline h-full" />
         <div className="fe-grid h-full" />
      </div>

      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 pb-40">
        <div className="mb-16">
           <div className="fe-hologram text-sky-400 mb-2">Protocol Reference</div>
           <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase">Neural<span className="text-amber-500">Atlas</span></h1>
           <p className="text-white/40 mt-4 font-light tracking-tight max-w-lg italic">
             &quot;To control the planet, one must first understand the fracture.&quot; — Command Alpha
           </p>
        </div>

        <div className="space-y-24">
           {/* Section 1: Turn Flow */}
           <div className="relative p-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl">
              <div className="absolute -top-4 -left-4 fe-hologram text-amber-500 bg-black px-4 py-2 border border-amber-500/30 rounded-xl">01: TURN_CYCLE</div>
              <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase italic">The Procurement Loop</h2>
              <div className="space-y-6 text-white/70 font-light leading-relaxed">
                 <p><strong className="text-amber-500 font-bold">1. PROCUREMENT (Draw):</strong> Every turn begins by accessing the deck. You MUST draw exactly 1 unit of tactical data.</p>
                 <p><strong className="text-amber-500 font-bold">2. DEPLOYMENT (Play):</strong> You may deploy <span className="text-white font-bold italic">1 to 3 cards</span> from your hand to the table. Most cards provide Energy (Points) or affect the global environment.</p>
                 <p><strong className="text-amber-500 font-bold">3. TERMINATION (End):</strong> Once your actions are spent (or you choose to hold), terminate control to pass to the next candidate.</p>
              </div>
           </div>

           {/* Section 2: Tactical Cards */}
           <div className="space-y-12">
              <h2 className="fe-hologram text-sky-400 text-center">Tactical Classification (220 Cards)</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                 {[
                   { name: 'SURVIVAL', color: 'text-emerald-400', desc: 'Secure vital resources. Provides consistent Energy gain.' },
                   { name: 'DISASTER', color: 'text-rose-400', desc: 'Siphon enemy resources. Damages health or steals points.' },
                   { name: 'POWER', color: 'text-sky-400', desc: 'Persistent structures. Stays on table to block matching attacks.' },
                   { name: 'ADAPT', color: 'text-cyan-400', desc: 'Reactive protocols. Block disasters or heal instantly.' },
                   { name: 'CHAOS', color: 'text-fuchsia-400', desc: 'Unpredictable events. Steal points, swap hands, or warp reality.' },
                   { name: 'ASCENDED', color: 'text-amber-500', desc: 'Elite protocols. High-tier effects that can dominate the match.' },
                   { name: 'TWIST', color: 'text-purple-400', desc: 'Instant lucky breaks. Triggers immediately when drawn.' },
                   { name: 'CATACLYSM', color: 'text-red-500', desc: 'Total devastation. Negative effects that affect all candidates.' }
                 ].map(type => (
                   <div key={type.name} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <h3 className={`font-black tracking-widest ${type.color} mb-2`}>{type.name}</h3>
                      <p className="text-xs text-white/40 leading-relaxed font-light">{type.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Section 3: Victory Conditions */}
           <div className="text-center p-12 border-t border-white/10">
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-6">Ascension Profile</h2>
              <p className="text-white/40 max-w-md mx-auto leading-relaxed">
                The first candidate to reach the <span className="text-amber-500 font-bold">100 Point</span> threshold or survive as the last player standing will be granted total planetary authority.
              </p>
           </div>
        </div>

        <div className="mt-20 flex justify-center gap-6">
           <Link href="/" className="fe-holo-btn">Return Home</Link>
           <Link href="/tutorial" className="fe-holo-btn !border-amber-500/50 !text-amber-500">Practice Protocol</Link>
        </div>
      </section>
    </main>
  );
}
