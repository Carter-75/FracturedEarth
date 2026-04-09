'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToLogs, clearLogs, type LogEntry } from '@/lib/logDiagnostics';

export default function NeuralDiagnostics() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    return subscribeToLogs(setLogs);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  if (!hasMounted) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-4 z-[9999] fe-hologram p-2 px-4 border border-[var(--accent)]/30 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase hover:bg-[var(--accent)]/20 transition-all opacity-40 hover:opacity-100"
      >
        Neural_Diag_{logs.length > 0 ? `(${logs.length})` : 'OK'}
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed z-[9999] flex flex-col bg-black/98 shadow-2xl backdrop-blur-3xl overflow-hidden transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 md:bottom-auto md:top-[calc(var(--header-height,60px)+1rem)] w-80 h-16 border border-white/10 rounded-2xl' 
            : 'inset-0 md:inset-auto md:right-4 md:top-[calc(var(--header-height,60px)+1rem)] md:w-[min(90vw,32rem)] md:h-[min(80vh,40rem)] md:max-h-[70vh] md:border border-white/10 md:rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full animate-pulse ${logs.some(l => l.level === 'error') ? 'bg-rose-500 shadow-[0_0_10px_rose-500]' : 'bg-emerald-500 shadow-[0_0_10px_emerald-500]'}`} />
             <span className="text-[10px] font-black tracking-widest text-[var(--accent)] uppercase opacity-60">Neural_Diagnostics_Link</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/5 rounded text-[var(--fg)] opacity-40 hover:opacity-100 uppercase text-[8px] font-black">
              {isMinimized ? 'Expand' : 'Collapse'}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-rose-500/10 rounded text-rose-500 opacity-40 hover:opacity-100 uppercase text-[8px] font-black">
              Close
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Scroll Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                   No anomalies detected in the frequency stream.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        log.level === 'error' ? 'bg-rose-500/20 text-rose-500' : 
                        log.level === 'warn' ? 'bg-amber-500/20 text-amber-500' : 'bg-sky-500/20 text-sky-500'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-[8px] opacity-20 font-mono">
                        {hasMounted ? new Date(log.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--fg)] opacity-70 leading-relaxed font-mono break-all">
                      {log.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 flex gap-2">
               <button 
                 onClick={clearLogs}
                 className="flex-1 fe-holo-btn !py-2 !text-[8px] !bg-white/5 !border-white/10 !text-white/40 font-black hover:!text-white"
               >
                 Flush_Buffer
               </button>
               <button 
                 onClick={() => {
                   const text = logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.level.toUpperCase()}: ${l.message}`).join('\n');
                   navigator.clipboard.writeText(text);
                 }}
                 className="flex-1 fe-holo-btn !py-2 !text-[8px] !bg-[var(--accent)]/10 !border-[var(--accent)]/30 !text-[var(--accent)] font-black hover:!bg-[var(--accent)]/20"
               >
                 Export_Logs
               </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
