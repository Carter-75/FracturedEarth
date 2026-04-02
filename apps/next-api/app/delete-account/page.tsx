'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DeleteAccountPage() {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!confirm('PROTOCOL WARNING: This will permanently purge your NeuralAtlas identity. This action is irreversible. Proceed?')) {
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Purge complete. Your data has been removed from the NeuralAtlas.');
      } else {
        throw new Error(data.error || 'Purge failed');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-8">
        <div>
           <div className="fe-hologram text-rose-500 mb-2 tracking-[0.5em] uppercase text-[10px] font-black">Protocol // Purge</div>
           <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Account<span className="text-rose-600 block sm:inline">Deletion</span></h1>
        </div>
        <Link href="/" className="fe-holo-btn !py-2 !px-4 text-xs shrink-0 text-center">Abort Purge</Link>
      </div>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-sm text-white/70 leading-relaxed font-light">
        <p className="text-white/90 text-base">
          Initiating an account deletion request will permanently purge your data from the Fractured Earth NeuralAtlas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
           <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3 uppercase tracking-tight text-xs">Primary Data Purged</h3>
              <ul className="space-y-2 opacity-80 text-[12px] list-disc pl-4">
                <li>Global Profile & Rank</li>
                <li>Match History & Archive</li>
                <li>Purchased Credentials</li>
                <li>NeuralAtlas Sync Data</li>
              </ul>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3 uppercase tracking-tight text-xs">Retained Data</h3>
              <p className="opacity-80 text-[12px]">
                Transient room codes and active match session keys are automatically rotated and expired. 
                Anonymous analytics data is not linked to your deleted identity.
              </p>
           </div>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-white font-bold uppercase tracking-tight">Automated Self-Service Purge</h3>
          <p>
            Enter your NeuralAtlas Identity (Google Account ID or User ID from Profile settings) below to trigger an immediate purge.
          </p>
          
          <form onSubmit={handlePurge} className="space-y-4">
            <input
              type="text"
              placeholder="YOUR-IDENTITY-TOKEN"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
              disabled={status === 'loading' || status === 'success'}
            />
            
            <button
              type="submit"
              disabled={!userId || status === 'loading' || status === 'success'}
              className={`fe-holo-btn block w-full text-center !py-4 transition-all ${
                status === 'success' 
                ? '!bg-emerald-600/20 !border-emerald-600/30 !text-emerald-500' 
                : '!bg-rose-600/10 !border-rose-600/30 !text-rose-500 hover:!bg-rose-600/20'
              } disabled:opacity-50`}
            >
              {status === 'loading' ? 'EXECUTING PURGE...' : status === 'success' ? 'PURGE COMPLETE' : 'EXECUTE AUTOMATED PURGE'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-xl text-xs ${status === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5">
          <h3 className="text-white font-bold mb-4 uppercase tracking-tight">Manual Request Method</h3>
          <p className="mb-4">
            Alternatively, you can contact our support team manually from the email address associated with your account:
          </p>
          
          <a 
            href="mailto:support@fractured-earth.com?subject=Account Deletion Request" 
            className="text-amber-500 hover:underline block"
          >
            support@fractured-earth.com
          </a>
        </div>

        <div className="pt-4 text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-40">
            Automated purges are processed instantly. NeuralAtlas Protocol // Sector 7 Compliance.
          </p>
        </div>
      </section>
    </main>
  );
}
