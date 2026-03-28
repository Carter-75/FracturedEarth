'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS } from '@/lib/gameConfig';
import { InterstitialAd } from '@/components/InterstitialAd';
import {
  clearRoomPin,
  loadLocalSettings,
  loadRoomPin,
  saveLocalSettings,
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
  const router = useRouter();
  const [userId, setUserId] = useState('web_player');
  const [displayName, setDisplayName] = useState('Web Player');
  const [emoji, setEmoji] = useState('🌍');
  const [roomCode, setRoomCode] = useState('');
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
    if (pin) {
      setRoomCode(pin.code);
    }
  }, []);

  useEffect(() => {
    if (!roomCode.trim()) return;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refresh = async () => {
      try {
        const code = roomCode.trim().toUpperCase();
        const res = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
        if (!res.ok) { setRoom(null); return; }
        const nextRoom = await res.json();
        if (cancelled) return;
        setRoom(nextRoom);
        
        const isMember = nextRoom.members.some((m: any) => m.userId === userId && !m.disconnectedAtEpochMs);
        if (isMember) {
          await fetch(`/api/rooms/${code}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        }

        if (nextRoom.status === 'IN_GAME' && isMember) {
           router.push(`/tabletop/${code}?userId=${encodeURIComponent(userId)}`);
        }
      } catch { setError('Sync error.'); } finally {
        if (!cancelled) pollTimer = setTimeout(refresh, 2000);
      }
    };
    refresh();
    return () => { cancelled = true; clearTimeout(pollTimer); };
  }, [roomCode, userId, router]);

  async function createRoom() {
    setBusyAction('create');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, hostDisplayName: displayName, hostEmoji: emoji, maxPlayers: 4 }),
      });
      const data = await res.json();
      setRoom(data);
      setRoomCode(data.code);
      saveRoomPin({ code: data.code, userId, displayName, emoji, ttlMs: 600000 });
    } catch (e) { setError('Failed to create room.'); } finally { setBusyAction(''); }
  }

  async function joinRoom() {
    setBusyAction('join');
    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName, emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoom(data);
      setRoomCode(data.code);
      saveRoomPin({ code: data.code, userId, displayName, emoji, ttlMs: 600000 });
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
      const res = await fetch(`/api/rooms/${room!.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/tabletop/${room!.code}?userId=${encodeURIComponent(userId)}`);
    } catch (e: any) { setError(e.message); } finally { setBusyAction(''); }
  }

  async function addBot() {
    if (!room || !amHost) return;
    setBusyAction('bot');
    try {
      const res = await fetch(`/api/rooms/${room.code}/lobby`, {
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
      const res = await fetch(`/api/rooms/${room.code}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, operation: 'REMOVE_MEMBER', targetUserId }),
      });
      const data = await res.json();
      setRoom(data);
    } catch (e) { setError('Failed to remove.'); } finally { setBusyAction(''); }
  }

  return (
    <main className="fe-scene bg-black overflow-y-auto sm:overflow-hidden flex items-center justify-center">
      {/* Cinematic Environment */}
      <div className="absolute inset-0 z-0 h-full">
         <img src="/assets/type-bgs/adapt.png" className="w-full h-full object-cover opacity-20 blur-2xl scale-125" alt="" />
         <div className="fe-vignette h-full" />
         <div className="fe-scanline h-full" />
         <div className="fe-grid h-full" />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-12 left-12 z-50">
         <div className="fe-hologram text-amber-500/60 mb-2 font-bold tracking-[0.2em] text-[10px]">Sector Frequency Link 1.0</div>
         <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">SECTOR<span className="text-amber-500 font-bold block">LOBBY</span></h1>
      </div>

      <div className="relative z-10 w-full max-w-7xl px-12 grid lg:grid-cols-[1.3fr_0.7fr] gap-12 items-center">
         
         {/* The 3D Table for Seats */}
         <div className="relative h-[48rem] flex items-center justify-center">
             <div className="absolute w-[45rem] h-[34rem] border border-white/5 rounded-[100%] [transform:rotateX(60deg)] bg-blue-500/[0.03] shadow-[0_0_100px_rgba(59,130,246,0.05)]" />
             
             <div className="relative w-full h-full">
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
         <div className="bg-[#0a0c0f]/80 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl space-y-10 shadow-3xl relative">
            <div className="absolute top-0 right-10 w-24 h-1 bg-amber-500" />
            
            <div className="space-y-4">
               <div className="fe-hologram text-sky-400 text-[10px] uppercase font-black">Candidate Identification</div>
               <div className="grid grid-cols-[1fr_auto] gap-4">
                  <input 
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-amber-500 transition-all font-bold tracking-tight text-xl placeholder:text-white/10"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Candidate Name"
                  />
                  <select 
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-3xl outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                  >
                    {EMOJI_OPTIONS.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-4">
               <div className="fe-hologram text-sky-400 text-[10px] uppercase font-black">Sector Frequency Code</div>
               <div className="grid grid-cols-[1fr_auto] gap-4">
                  <input 
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-amber-500 transition-all font-black tracking-[0.5em] uppercase text-2xl text-center placeholder:text-white/10"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="SCANNING"
                    maxLength={6}
                  />
                  <button onClick={joinRoom} className="fe-holo-btn !px-10 !text-lg !font-black !tracking-widest active:scale-95 transition-all">SYNC</button>
               </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                {!room ? (
                   <button onClick={createRoom} className="fe-holo-btn !py-6 !text-lg !border-amber-500/50 !text-amber-500 !bg-amber-500/5 hover:!bg-amber-500/10 transition-all font-black">ESTABLISH SECTOR</button>
                ) : (
                   <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs fe-hologram text-white/40 px-2 font-bold uppercase tracking-widest">
                         <span>Players: {activeMembers.length}/4</span>
                         <span className="text-emerald-500">Linked</span>
                      </div>
                      {canStart ? (
                         <button onClick={startRoom} className="fe-holo-btn !py-6 !text-lg !bg-emerald-500/10 !border-emerald-500 !text-emerald-400 animate-pulse transition-all font-black">INITIATE PROTOCOL</button>
                      ) : (
                         <div className="fe-holo-btn !py-6 !text-lg !bg-white/5 !border-white/10 !text-white/20 !cursor-not-allowed text-center uppercase font-black">Waiting for Participants</div>
                      )}
                      {amHost && activeMembers.length < 4 && (
                         <button onClick={addBot} className="fe-holo-btn !py-4 !text-xs !text-sky-400/60 hover:!text-sky-400">Deploy Tactical Bot</button>
                      )}
                   </div>
                )}
            </div>

            {error && <div className="absolute -bottom-12 left-0 right-0 text-rose-500 fe-hologram text-center text-xs animate-flicker font-black uppercase tracking-widest">{error}</div>}
         </div>
      </div>

      <Link href="/" className="absolute bottom-12 left-12 fe-hologram text-white/20 hover:text-white transition-all text-[10px] tracking-[0.4em] font-black uppercase">← TERMINATE SESSION</Link>

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
  const radiusX = seat === 'bottom' || seat === 'top' ? 0 : seat === 'left' ? -300 : 300;
  const radiusY = seat === 'left' || seat === 'right' ? 0 : seat === 'top' ? -240 : 240;

  return (
    <div 
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ${member ? 'opacity-100 scale-100' : 'opacity-10 scale-90'}`}
      style={{ transform: `translate(calc(-50% + ${radiusX}px), calc(-50% + ${radiusY}px))` }}
    >
       <div className={`group w-36 h-36 rounded-[2rem] flex flex-col items-center justify-center text-5xl bg-[#050608] border-2 transition-all duration-500 relative ${active ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'border-white/5 focus-within:border-white/20'}`}>
          <div className="fe-grid absolute inset-0 opacity-10 pointer-events-none" />
          
          <span className="relative z-10 transition-transform group-hover:scale-110 duration-500">{member ? member.emoji : '?'}</span>
          
          {/* Seat Controls */}
          {member && amHost && member.userId !== 'host' && (
             <button onClick={onKick} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-500 text-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">×</button>
          )}
          {!member && amHost && (
             <button onClick={onAddBot} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all bg-sky-500/10 rounded-[2rem]">
                <span className="fe-hologram text-sky-400 text-xs font-black">+ BOT</span>
             </button>
          )}
       </div>
       <div className="mt-8 text-center pointer-events-none">
          <div className="fe-hologram text-[9px] text-sky-400/40 mb-1 font-black tracking-[0.2em]">{seat.toUpperCase()} TERMINAL</div>
          <div className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">{member ? member.displayName : 'NO SIGNAL'}</div>
       </div>
    </div>
  );
}
