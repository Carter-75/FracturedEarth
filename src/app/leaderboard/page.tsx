import Link from 'next/link';
import { getLeaderboard } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const leaders = await getLeaderboard(25);

  return (
    <main className="fe-scene bg-black overflow-y-auto min-h-screen">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0 h-full fixed">
         <img src="/assets/type-bgs/chaos.png" className="w-full h-full object-cover opacity-10 blur-3xl scale-125" alt="" />
         <div className="fe-vignette h-full" />
         <div className="fe-scanline h-full" />
         <div className="fe-grid h-full opacity-20" />
      </div>

      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 pb-40">
        <div className="mb-16 flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-white/10 pb-8 gap-6">
           <div>
              <div className="fe-hologram text-sky-400 mb-2 fe-flicker">Archival_Data_Retrieved</div>
              <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none break-words">Global<span className="text-amber-500 block sm:inline">Standings</span></h1>
              <p className="text-white/30 mt-4 font-light tracking-widest text-[10px] uppercase">Neural Network Ranking Protocol v4.0</p>
           </div>
           <Link href="/" className="fe-holo-btn !py-2 !px-4 text-xs shrink-0 text-center">Return_Home</Link>
        </div>

        <div className="space-y-4">
           {leaders.length === 0 ? (
             <div className="text-center py-32 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl">
                <div className="fe-hologram text-amber-500/40 mb-4">NO_SIGNALS_DETECTED</div>
                <p className="text-white/20 text-xs tracking-widest uppercase">The sector history is currently blank.</p>
             </div>
           ) : (
             <>
               <div className="overflow-x-auto pb-4">
                 <div className="min-w-[600px]">
                   {/* Table Header */}
                   <div className="flex items-center px-8 py-3 bg-white/5 border border-white/5 rounded-full mb-8 fe-hologram text-[8px] text-white/40">
                      <div className="w-16">Rank</div>
                      <div className="flex-1">Candidate_Identifier</div>
                      <div className="w-32 text-right">Energy_Yield</div>
                   </div>

                   {leaders.map((entry, i) => (
                     <div
                       key={entry.member}
                       className="group relative flex items-center px-8 py-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-sky-500/30 transition-all cursor-default mb-4"
                       style={{ transform: `translateZ(${i * -2}px)` }}
                     >
                       {/* Ranking Pip */}
                       <div className="w-16 flex items-center">
                          <span className={`text-2xl font-black italic ${i < 3 ? 'text-amber-500 fe-glow-text' : 'text-white/20'}`}>
                             {(i + 1).toString().padStart(2, '0')}
                          </span>
                       </div>

                       {/* Identity */}
                       <div className="flex-1">
                          <div className="text-xl font-bold text-white/90 group-hover:text-white transition-colors tracking-tight uppercase italic truncate max-w-[300px]">{entry.member}</div>
                          <div className="fe-hologram text-[6px] text-sky-400/40 mt-1">STATUS: ACTIVE_COMBATANT</div>
                       </div>

                       {/* Score */}
                       <div className="w-32 text-right">
                          <div className="text-3xl font-black italic text-sky-400 fe-glow-text leading-none">{entry.score}</div>
                          <div className="text-[6px] font-bold tracking-widest text-sky-400/30 mt-1 uppercase">ARCHIVED_VP</div>
                       </div>

                       {/* Decoration Corner */}
                       <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-sky-400/50" />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </>
           )}
        </div>

        {/* Bottom Metadata */}
        <div className="mt-24 text-center">
           <div className="inline-block p-6 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl">
              <div className="fe-hologram text-amber-500/60 text-[8px] mb-2 fe-flicker">SYNC_STATUS: 100%_NOMINAL</div>
              <p className="text-white/20 text-[9px] uppercase tracking-widest leading-relaxed">
                 Rankings are computed across all verified planetary fragments.<br/>
                 Integrity checks passed.
              </p>
           </div>
        </div>
      </section>
    </main>
  );
}

