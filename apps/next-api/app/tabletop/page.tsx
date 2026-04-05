'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { loadLocalSettings, saveRoomPin, clearRoomPin } from '@/lib/localProfile';
import { MatchPayload, StateEnvelope, MatchAction } from '@/types/game';
import { MatchCard, MatchPlayer, cardTheme } from '@/lib/tabletopShared';
import PhysicalCard from '@/components/PhysicalCard';

// --- UI COMPONENTS ---

function PlayerStatsHUD({ player, isActive }: { player: MatchPlayer; isActive: boolean }) {
  return (
    <div className={`flex flex-col gap-2 p-6 rounded-[var(--radius)] bg-[var(--panel)] backdrop-blur-3xl border ${isActive ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]' : 'border-[var(--border)]'} min-w-[12rem]`}>
        <div className="flex items-center gap-3">
           <div className="text-2xl">{player.emoji}</div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--fg)] opacity-40">{player.displayName}</span>
              <div className={`h-[2px] ${isActive ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--glow-color)]' : 'bg-[var(--border)]'} w-8 mt-1`} />
           </div>
        </div>
        <div className="flex justify-between items-end mt-4">
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-[var(--fg)] opacity-50 uppercase tracking-widest">Cards</span>
              <div className="text-3xl font-black italic text-[var(--fg)] opacity-80 fe-glow-text">{player.hand.length}</div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-[var(--accent-soft)] opacity-60 uppercase tracking-widest">Energy</span>
              <div className="text-3xl font-black italic text-[var(--accent-soft)] fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-rose-500 opacity-60 uppercase tracking-widest">Health</span>
              <div className="text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>

       {/* Pinned Powers/Traits */}
       {player.powers && player.powers.length > 0 && (
          <div className="absolute top-full mt-4 flex justify-center gap-2 [transform-style:preserve-3d]">
             {player.powers.map((card) => (
                <div key={card.id} className="relative w-16 h-24 bg-[var(--bg)] rounded-lg border border-[var(--accent)]/30 overflow-hidden shadow-[0_4px_10px_rgba(var(--accent-rgb),0.2)]" style={{ transform: `translateZ(10px)` }}>
                   <div className="absolute inset-0 bg-[var(--accent)]/10" />
                   <div className="fe-hologram text-[6px] text-[var(--accent)] opacity-80 p-1 text-center font-bold absolute bottom-0 w-full bg-black/50">{card.name}</div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}

function PlayPile({ cards }: { cards: MatchCard[] }) {
  return (
    <div 
      className="relative [transform-style:preserve-3d] flex items-center justify-center" 
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
    >
       <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl [transform:translateZ(-10px)]" />
       <AnimatePresence>
          {cards.map((card, i) => (
             <motion.div
               key={card.id}
               initial={{ opacity: 0, y: -200, rotateX: -90 }}
               animate={{ 
                 opacity: 1, 
                 y: 0, 
                 rotateX: 0, 
                 z: i * 2, 
                 rotate: (i - (cards.length-1)/2) * 5,
                 x: `calc(${(i - (cards.length-1)/2)} * (var(--card-w) * 0.2))`
               }}
               style={{ transformStyle: 'preserve-3d' }}
               className="absolute inset-0"
             >
                <PhysicalCard card={card} className="w-full h-full shadow-2xl" />
             </motion.div>
          ))}
       </AnimatePresence>
    </div>
  );
}

function FloatingDeck({ count, canDraw, onDraw, highlighted }: { count: number; canDraw: boolean; onDraw: () => void; highlighted?: boolean }) {
  return (
    <div 
      className={`relative group cursor-pointer transition-all ${highlighted ? 'ring-4 ring-[var(--accent-soft)] ring-offset-8 ring-offset-black rounded-[var(--radius)]' : ''}`} 
      onClick={onDraw}
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
    >
       {[...Array(3)].map((_, i) => (
         <div key={i} className="absolute inset-0 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)]" style={{ transform: `translateZ(${i * 2}px) translateY(-${i}px)` }} />
       ))}
       <motion.div whileHover={canDraw ? { y: -5 } : {}} className={`absolute inset-0 bg-[var(--panel-alt)] border-2 border-[var(--border)] rounded-[var(--radius)] flex items-center justify-center overflow-hidden ${!canDraw ? 'opacity-30' : ''}`}>
          <div className="fe-grid" />
          <div className="relative z-10 flex flex-col items-center gap-1">
             <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--accent-soft)] rounded-full shadow-[0_0_10px_var(--accent-soft)]" />
             </div>
             <span className="text-[8px] font-black tracking-[0.4em] opacity-40">DECK ({count})</span>
          </div>
       </motion.div>
    </div>
  );
}

function OpponentHand({ count, angle, player, isActive }: { count: number; angle: number; player: MatchPlayer; isActive: boolean }) {
  return (
    <div 
      className="absolute flex items-end justify-center pointer-events-none"
      style={{ 
        transform: `rotate(${angle}deg) translateY(var(--opp-offset)) rotateX(-30deg)`,
        transformStyle: 'preserve-3d',
        top: '50%',
        left: '50%',
      }}
    >
       <div className="absolute left-1/2 top-0 -translate-x-1/2 flex justify-center [transform-style:preserve-3d] w-0">
          {[...Array(Math.max(0, count))].map((_, i) => (
             <motion.div
               key={i}
               style={{ 
                 width: 'calc(var(--card-w) * 0.65)',
                 height: 'calc(var(--card-h) * 0.65)',
                 transform: `translateX(calc(${(i - (count-1)/2)} * (var(--card-w) * 0.25))) rotate(${(i - (count-1)/2) * 8}deg)`,
                 transformOrigin: 'bottom center',
                 transformStyle: 'preserve-3d',
                 position: 'absolute'
               }}
               className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl overflow-hidden -top-full -translate-y-1/2"
             >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--panel-alt)_0%,var(--bg)_100%)]" />
                <div className="fe-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-6 h-6 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                      <div className="w-1.5 h-1.5 bg-[var(--accent-soft)] rounded-full" />
                   </div>
                </div>
                <div className="absolute bottom-1 left-0 right-0 text-center opacity-10">
                   <span className="text-[4px] fe-hologram tracking-widest text-[var(--accent-soft)] uppercase">Fractured Earth</span>
                </div>
             </motion.div>
            ))}
        </div>

       <div className="fe-hologram flex flex-col pointer-events-auto" style={{ transform: 'translateZ(40px) translateY(80px)', minWidth: '150px' }}>
          <PlayerStatsHUD player={player} isActive={isActive} />
       </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function TabletopPage() {
  const search = useSearchParams();
  const router = useRouter();
  const code = search.get('code')?.toUpperCase() || '';
  const [state, setState] = useState<StateEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const userId = useMemo(() => loadLocalSettings().userId, []);
  const payload = state?.payload;
  const myPlayer = payload?.players.find(p => p.id === userId);
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const isMyTurn = activePlayer?.id === userId;
  const opponents = payload?.players.filter(p => p.id !== userId) || [];
  const selectedCard = myPlayer?.hand.find(c => c.id === selectedCardId);

  async function sync() {
    try {
      const res = await apiFetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
      if (res.status === 404) {
        setError('ROOM_NOT_FOUND_OR_CLOSED');
        return;
      }
      if (!res.ok) return;
      const stateSnapshot = await res.json();
      setState(stateSnapshot);
      setError(null);
    } catch (e) {}
  }

  useEffect(() => {
    if (!code) return;
    sync();
    const timer = setInterval(sync, 2000);
    return () => clearInterval(timer);
  }, [code]);

  useEffect(() => {
     if (myPlayer && code) {
        saveRoomPin({ 
           code, 
           userId, 
           displayName: myPlayer.displayName, 
           emoji: myPlayer.emoji, 
           ttlMs: 60000 
        });
     }
  }, [myPlayer, code, userId]);

  async function performAction(action: Partial<MatchAction>) {
    if (!state) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, expectedRevision: state.revision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      setSelectedCardId(null);
      setSelectedTargetId(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error === 'ROOM_NOT_FOUND_OR_CLOSED') {
     return (
        <div className="fe-scene flex flex-col items-center justify-center">
           <h1 className="text-4xl font-black text-rose-500 mb-4 fe-flicker">LINK_SEVERED</h1>
           <p className="text-white/40 mb-8 lowercase tracking-widest">Room does not exist or has been terminated.</p>
           <Link href="/lan" className="fe-holo-btn">Return to Base</Link>
        </div>
     );
  }

  if (!state) {
    return (
      <div className="fe-scene flex flex-col items-center justify-center">
         <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
         <div className="fe-hologram animate-pulse text-[var(--accent)]">SYNCING_SECTOR_STATE...</div>
      </div>
    );
  }

  return (
    <main className="fe-scene overflow-hidden relative cursor-crosshair">
      <div className="fe-vignette z-10" />
      <div className="fe-grid opacity-20 pointer-events-none" />

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50">
          <div className="flex flex-col">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--accent)] opacity-60">Session_Protocol</div>
             <h1 className="text-4xl font-black italic tracking-tighter text-[var(--fg)] fe-flicker uppercase">Sector_{code}</h1>
          </div>
          <div className="flex gap-4">
             <Link href="/lan" className="fe-holo-btn !py-2 !px-4 text-xs opacity-50 hover:opacity-100">Abort</Link>
          </div>
      </div>

      {/* ARENA 3D SPACE */}
      <div className="absolute inset-0 flex items-center justify-center [perspective:2000px]">
          <div className="relative w-full h-full [transform-style:preserve-3d]">
              
              {/* Opponents Around Table */}
              {opponents.map((opp, i) => {
                 const angles = opponents.length === 1 ? [180] : opponents.length === 2 ? [150, 210] : [135, 180, 225];
                 return (
                    <OpponentHand 
                      key={opp.id} 
                      player={opp} 
                      count={opp.hand.length} 
                      isActive={activePlayer?.id === opp.id}
                      angle={angles[i]} 
                    />
                 );
              })}

              {/* Central Play Pile */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform:rotateX(60deg) translateZ(0)]">
                  <PlayPile cards={payload?.turnPile || []} />
              </div>

              {/* Draw Pile (Left) */}
              <div className="absolute top-1/2 left-[20%] -translate-y-1/2 [transform:rotateX(60deg) translateZ(20px)]">
                  <div className="flex flex-col items-center gap-4">
                     <FloatingDeck 
                        count={payload?.drawPile.length || 0} 
                        canDraw={isMyTurn && payload?.cardsPlayedThisTurn === 0} 
                        onDraw={() => isMyTurn && performAction({ type: 'DRAW_CARD' })}
                        highlighted={isMyTurn && payload?.cardsPlayedThisTurn === 0}
                     />
                     <span className="fe-hologram text-[6px] text-white/30 uppercase tracking-[0.3em]">Sector_Draw_Stack</span>
                  </div>
              </div>

              {/* Discard Pile (Right) */}
              <div className="absolute top-1/2 right-[20%] -translate-y-1/2 [transform:rotateX(60deg) translateZ(20px)]">
                 <div className="flex flex-col items-center gap-4 opacity-50">
                    <div className="w-[var(--card-w)] h-[var(--card-h)] border-2 border-dashed border-white/10 rounded-[var(--radius)] flex items-center justify-center">
                       <span className="text-[8px] font-black tracking-widest text-white/20 uppercase">Recall</span>
                    </div>
                    <span className="fe-hologram text-[6px] text-white/30 uppercase tracking-[0.3em]">Recall_Buffer</span>
                 </div>
              </div>
          </div>
      </div>

      {/* PLAYER HUD & HAND (BOTTOM) */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none z-50">
          
          {/* Action Status */}
          <div className="mb-8 flex flex-col items-center">
             <AnimatePresence mode="wait">
                {isMyTurn ? (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                     className="fe-hologram text-[var(--accent)] font-black text-sm uppercase tracking-[0.5em] bg-[var(--accent)]/5 px-6 py-2 rounded-full border border-[var(--accent)]/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] mb-4"
                   >
                      Your Turn - Select Protocol
                   </motion.div>
                ) : (
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                     className="text-white/20 text-[10px] uppercase tracking-[0.5em] mb-4"
                   >
                      Waiting for {activePlayer?.displayName}...
                   </motion.div>
                )}
             </AnimatePresence>
             
             {isMyTurn && (
                <button 
                  onClick={() => performAction({ type: 'END_TURN' })}
                  disabled={busy}
                  className="fe-holo-btn pointer-events-auto !py-2 !px-8 text-xs border-white/20 !bg-white/5 hover:!bg-white/10"
                >
                  End Turn
                </button>
             )}
          </div>

          <div className="w-full max-w-6xl flex items-end justify-between gap-12">
              <div className="pointer-events-auto">
                 {myPlayer && <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />}
              </div>

              {/* Physical Hand Fan */}
              <div className="flex-1 flex justify-center [perspective:1000px] h-[300px] pointer-events-auto">
                  <div className="relative w-full max-w-2xl flex justify-center items-end h-full">
                     {myPlayer?.hand.map((card, i) => {
                        const count = myPlayer.hand.length;
                        const angle = (i - (count-1)/2) * (count > 5 ? 30/count : 8);
                        const x = (i - (count-1)/2) * (count > 6 ? 400/count : 60);
                        const y = Math.abs(i - (count-1)/2) * (count > 5 ? 10/count : 5);
                        
                        return (
                           <motion.div
                              key={card.id}
                              initial={{ y: 200, opacity: 0 }}
                              animate={{ 
                                y: selectedCardId === card.id ? -100 : y,
                                x,
                                rotate: angle,
                                opacity: 1,
                                zIndex: selectedCardId === card.id ? 100 : i
                              }}
                              whileHover={{ y: selectedCardId === card.id ? -100 : -20, scale: 1.05 }}
                              className="absolute bottom-0 cursor-pointer origin-bottom"
                              onClick={() => {
                                 if (selectedCardId === card.id) setSelectedCardId(null);
                                 else setSelectedCardId(card.id);
                              }}
                           >
                              <PhysicalCard 
                                 card={card} 
                                 isSelected={selectedCardId === card.id}
                                 className="w-[140px] h-[210px] shadow-2xl" 
                              />
                           </motion.div>
                        );
                     })}
                  </div>
              </div>

              {/* Action Sidebar / Selected Card Info */}
              <div className="w-64 h-64 flex flex-col justify-end pointer-events-auto">
                 <AnimatePresence>
                    {selectedCard && (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                         className="p-6 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--accent)]/30 backdrop-blur-3xl space-y-4"
                       >
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase text-[var(--accent)] tracking-widest">Protocol_Details</span>
                             <h4 className="text-xl font-black italic tracking-tighter uppercase">{selectedCard.name}</h4>
                          </div>
                          
                          <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-tighter">{selectedCard.description || selectedCard.effect || 'No special directives.'}</p>
                          
                          {selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && (
                             <div className="space-y-1">
                                <label className="text-[7px] font-black uppercase text-rose-500 tracking-widest">Select Target</label>
                                <select 
                                  value={selectedTargetId || ''} 
                                  onChange={(e) => setSelectedTargetId(e.target.value)}
                                  className="w-full bg-black/40 border border-rose-500/30 rounded px-2 py-1 text-xs text-white"
                                >
                                   <option value="">Choose Witness...</option>
                                   {opponents.map(o => <option key={o.id} value={o.id}>{o.displayName}</option>)}
                                </select>
                             </div>
                          )}

                          <button 
                            disabled={busy || !isMyTurn}
                            onClick={() => performAction({ 
                               type: 'PLAY_CARD', 
                               cardId: selectedCard.id, 
                               targetPlayerId: selectedTargetId || undefined 
                            })}
                            className="w-full fe-holo-btn !py-3 !text-sm border-[var(--accent)] !bg-[var(--accent)]/10 hover:!bg-[var(--accent)]/20"
                          >
                             Execute Protocol
                          </button>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
          </div>
      </div>
    </main>
  );
}
