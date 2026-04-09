'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS } from '@/lib/gameConfig';
import { InterstitialAd } from '@/components/InterstitialAd';
import {
  loadLocalSettings,
  loadRoomPin,
  saveRoomPin,
} from '@/lib/localProfile';

type RoomMember = {
  userId: string;
  displayName: string;
  emoji: string;
  joinedAtEpochMs: number;
  disconnectedAtEpochMs?: number | null;
  lastHeartbeatEpochMs?: number;
  isBot?: boolean;
};

type Room = {
  code: string;
  hostUserId: string;
  hostDisplayName: string;
  mode: 'LOCAL_WIFI';
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  maxPlayers: number;
  members: RoomMember[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
};

type SeatPosition = 'bottom' | 'left' | 'top' | 'right';
const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

export default function LanRoomsPage() {
  return (
    <Suspense fallback={<div className="fe-scene flex-1 flex items-center justify-center"><div className="fe-hologram animate-pulse text-[var(--accent-soft)] text-xl tracking-[0.5em] fe-flicker">ESTABLISHING_LINK...</div></div>}>
      <LanContent />
    </Suspense>
  );
}

function LanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [roomCode, setRoomCode] = useState(searchParams.get('code') ?? '');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const amHost = room?.hostUserId === userId;
  const activeMembers = useMemo(
    () => (room?.members ?? []).filter((member) => !member.disconnectedAtEpochMs),
    [room],
  );
  const canStart = Boolean(amHost && room?.status === 'OPEN' && activeMembers.length >= 2);

  const seats = useMemo(() => {
    const orderedMembers = activeMembers.slice(0, 4);
    return SEAT_ORDER.map((position, index) => ({
      position,
      member: orderedMembers[index] ?? null,
    }));
  }, [activeMembers]);

  useEffect(() => {
    const settings = loadLocalSettings();
    setUserId(settings.userId);
    setDisplayName(settings.displayName);
    setEmoji(settings.emoji);
    
    const pin = loadRoomPin();
    if (pin && !roomCode) {
      setRoomCode(pin.code);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!room) return;
    async function sync() {
      try {
        const res = await apiFetch(`/api/rooms/${room!.code}/lobby?userId=${userId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'IN_GAME') {
           router.push(`/tabletop?code=${room!.code}&userId=${encodeURIComponent(userId)}`);
        } else {
           setRoom(data);
        }
      } catch (e) {}
    }
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [room, userId, router]);

  async function createRoom() {
    setBusyAction('create');
    try {
      const res = await apiFetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, hostDisplayName: displayName, hostEmoji: emoji, maxPlayers: 4 }),
      });
      const data = await res.json();
      setRoom(data);
      saveRoomPin({ code: data.code, userId, displayName, emoji, ttlMs: 60000 });
    } catch (e) { setError('Failed to create room.'); } finally { setBusyAction(''); }
  }

  async function joinRoom() {
    setBusyAction('join');
    try {
      const code = roomCode.trim().toUpperCase();
      const res = await apiFetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName, emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoom(data);
      saveRoomPin({ code: data.code, userId, displayName, emoji, ttlMs: 60000 });
    } catch (e: any) { setError(e.message); } finally { setBusyAction(''); }
  }

  const [showInterstitial, setShowInterstitial] = useState(false);

  async function startRoom() {
    if (!room || !amHost) return;
    setShowInterstitial(true);
  }

  async function proceedToStart() {
    setBusyAction('start');
    try {
      const res = await apiFetch(`/api/rooms/${room!.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/tabletop?code=${room!.code}&userId=${encodeURIComponent(userId)}`);
    } catch (e: any) { setError(e.message); } finally { setBusyAction(''); }
  }

  async function addBot() {
    if (!room || !amHost) return;
    setBusyAction('bot');
    try {
      const res = await apiFetch(`/api/rooms/${room.code}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, operation: 'ADD_BOT' }),
      });
      const data = await res.json();
      setRoom(data);
    } catch (e) { setError('Failed to add bot.'); } finally { setBusyAction(''); }
  }

  async function removeMember(targetUserId: string) {
    if (!room || !amHost) return;
    setBusyAction('remove');
    try {
      const res = await apiFetch(`/api/rooms/${room.code}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, operation: 'REMOVE_MEMBER', targetUserId }),
      });
      const data = await res.json();
      setRoom(data);
    } catch (e) { setError('Failed to remove.'); } finally { setBusyAction(''); }
  }

  return (
    <main className="fe-scene bg-black min-h-screen overflow-y-auto flex flex-col items-center">
      {/* Cinematic Environment */}
      <div className="absolute inset-0 z-0 h-full">
         <Image src="/assets/type-bgs/adapt.png" fill className="object-cover opacity-20 blur-2xl scale-125" alt="" unoptimized />
         <div className="fe-vignette h-full" />
         <div className="fe-scanline h-full" />
         <div className="fe-grid h-full" />
      </div>

      {/* Header Overlay */}
      <div className="relative z-50 w-full px-[5vw] pt-[calc(var(--header-height,60px)+2rem)] text-left">
         <div className="fe-hologram text-[var(--accent)] opacity-60 mb-2 font-bold tracking-[0.2em] text-[min(10px,2vw)]">Sector Frequency Link 1.0</div>
         <h1 className="text-[clamp(2.5rem,10vw,5rem)] font-black italic tracking-tighter text-[var(--fg)] uppercase leading-none">SECTOR<span className="text-[var(--accent)] font-bold block">LOBBY</span></h1>
      </div>

      <div className="relative z-10 w-full max-w-[95vw] px-[5vw] grid lg:grid-cols-[1.2fr_0.8fr] gap-[5vmin] items-center pt-12 pb-24 lg:py-0">
         
         {/* The 3D Table for Seats */}
         <div className="relative h-[60vh] flex items-center justify-center overflow-hidden lg:overflow-visible">
             <div className="absolute w-[90vw] h-[70vh] border border-white/5 rounded-[100%] [transform:rotateX(60deg)] bg-blue-500/[0.03] shadow-[0_0_100px_rgba(59,130,246,0.05)] scale-75 md:scale-100" />
             
             <div className="relative w-full h-full scale-[0.4] sm:scale-[0.6] md:scale-100 transition-transform duration-700">
                {seats.map((seat) => (
                  <SeatCard 
                    key={seat.position} 
                    seat={seat.position} 
                    member={seat.member} 
                    active={seat.member?.userId === userId}
                    onKick={() => removeMember(seat.member!.userId)}
                    onAddBot={addBot}
                    amHost={amHost}
                  />
                ))}
             </div>
         </div>

         {/* Configuration Panel */}
         <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] p-6 md:p-12 backdrop-blur-3xl space-y-8 md:space-y-10 shadow-3xl relative mx-4 lg:mx-0">
            <div className="absolute top-0 right-10 w-24 h-1 bg-[var(--accent)]" />
            
            <div className="space-y-4">
               <div className="fe-hologram text-[var(--accent-soft)] text-[10px] uppercase font-black">Candidate Identification</div>
               <div className="grid grid-cols-[1fr_auto] gap-3 md:gap-4">
                  <input 
                    className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-all font-bold tracking-tight text-lg md:text-xl placeholder:text-[var(--fg)] opacity-40 w-full"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Candidate Name"
                    maxLength={32}
                  />
                  <select 
                    className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 text-2xl md:text-3xl outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all text-[var(--fg)]"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                  >
                    {EMOJI_OPTIONS.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-4">
               <div className="fe-hologram text-[var(--accent-soft)] text-[10px] uppercase font-black">Sector Frequency Code</div>
               <div className="grid grid-cols-[1fr_auto] gap-3 md:gap-4">
                  <input 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-all font-black tracking-[0.3em] md:tracking-[0.5em] uppercase text-lg md:text-2xl text-center placeholder:text-[var(--fg)] opacity-40 w-full"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="SCANNING"
                    maxLength={6}
                  />
                  <button onClick={joinRoom} className="fe-holo-btn !px-6 md:!px-10 !text-sm md:!text-lg !font-black !tracking-widest active:scale-95 transition-all">SYNC</button>
               </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                {!room ? (
                   <button onClick={createRoom} className="fe-holo-btn !py-6 !text-lg !border-[var(--accent)]/50 !text-[var(--accent)] !bg-[var(--accent)]/5 hover:!bg-[var(--accent)]/10 transition-all font-black">ESTABLISH SECTOR</button>
                ) : (
                   <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs fe-hologram text-[var(--fg)] opacity-40 px-2 font-bold uppercase tracking-widest">
                         <span>Players: {activeMembers.length}/4</span>
                         <span className="text-emerald-500">Linked</span>
                      </div>
                      {canStart ? (
                         <button onClick={startRoom} className="fe-holo-btn !py-6 !text-lg !bg-emerald-500/10 !border-emerald-500 !text-emerald-400 animate-pulse transition-all font-black">INITIATE PROTOCOL</button>
                      ) : (
                         <div className="fe-holo-btn !py-6 !text-lg !bg-white/5 !border-white/10 !text-[var(--fg)] opacity-20 !cursor-not-allowed text-center uppercase font-black">Waiting for Participants</div>
                      )}
                      {amHost && activeMembers.length < 4 && (
                         <button onClick={addBot} className="fe-holo-btn !py-4 !text-xs !text-[var(--accent-soft)] opacity-60 hover:opacity-100">Deploy Tactical Bot</button>
                      )}
                   </div>
                )}
            </div>

            {error && <div className="absolute -bottom-12 left-0 right-0 text-rose-500 fe-hologram text-center text-xs animate-flicker font-black uppercase tracking-widest">{error}</div>}
         </div>
      </div>

      <div className="w-full px-[5vw] py-12 flex justify-start">
        <Link href="/" className="fe-hologram text-[var(--fg)] opacity-20 hover:opacity-100 transition-all text-xs tracking-[0.4em] font-black uppercase">← TERMINATE SESSION</Link>
      </div>

      {showInterstitial && (
         <InterstitialAd onComplete={() => {
            setShowInterstitial(false);
            proceedToStart();
         }} />
      )}
    </main>
  );
}

function SeatCard({ seat, member, active, onKick, onAddBot, amHost }: { seat: SeatPosition; member: RoomMember | null; active: boolean, onKick: () => void, onAddBot: () => void, amHost: boolean }) {
  // Responsive radius calculation
  const radiusX = seat === 'bottom' || seat === 'top' ? 0 : seat === 'left' ? -1 : 1;
  const radiusY = seat === 'left' || seat === 'right' ? 0 : seat === 'top' ? -1 : 1;

  const getTransform = () => {
    const xBase = 35; // vw
    const yBase = 25; // vh
    const x = radiusX * xBase;
    const y = radiusY * yBase;
    return `translate(calc(-50% + ${x}vw), calc(-50% + ${y}vh))`;
  };

  return (
    <div 
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ${member ? 'opacity-100 scale-100' : 'opacity-10 scale-90'}`}
      style={{ transform: getTransform() }}
    >
       <div className={`group w-32 h-32 md:w-36 md:h-36 rounded-[var(--radius)] flex flex-col items-center justify-center text-4xl md:text-5xl bg-[var(--bg)] border-2 transition-all duration-500 relative ${active ? 'border-[var(--accent)] shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]' : 'border-[var(--border)] focus-within:border-[var(--accent-soft)]'}`}>
          <div className="fe-grid absolute inset-0 opacity-10 pointer-events-none" />
          
          <span className="relative z-10 transition-transform group-hover:scale-110 duration-500">{member ? member.emoji : '?'}</span>
          
          {/* Seat Controls */}
          {member && amHost && member.userId !== 'host' && (
             <button onClick={onKick} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-500 text-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">×</button>
          )}
          {!member && amHost && (
             <button onClick={onAddBot} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all bg-[var(--accent-soft)]/10 rounded-[var(--radius)]">
                <span className="fe-hologram text-[var(--accent-soft)] text-xs font-black">+ BOT</span>
             </button>
          )}
       </div>
       <div className="mt-6 md:mt-8 text-center pointer-events-none">
          <div className="fe-hologram text-[8px] md:text-[9px] text-[var(--accent-soft)] opacity-40 mb-1 font-black tracking-[0.2em]">{seat.toUpperCase()} TERMINAL</div>
          <div className="text-lg md:text-xl font-black tracking-tighter text-[var(--fg)] uppercase italic leading-none">{member ? member.displayName : 'NO SIGNAL'}</div>
       </div>
    </div>
  );
}
