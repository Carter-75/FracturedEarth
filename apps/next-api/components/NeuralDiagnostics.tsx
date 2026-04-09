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
        className="fixed left-6 bottom-6 z-[9998] fe-btn !py-2 !px-4 !bg-surface/40 backdrop-blur-3xl !border-accent/10 hover:!bg-accent/10 transition-all opacity-40 hover:opacity-100 group"
      >
        <span className="fe-hologram text-[9px] text-accent/60 group-hover:text-accent">
          Neural_Diag_{logs.length > 0 ? `(${logs.length})` : 'OK'}
        </span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed z-[9999] flex flex-col bg-surface-raised/95 shadow-2xl backdrop-blur-3xl overflow-hidden transition-all duration-300 border border-white/5 ${
          isMinimized 
            ? 'bottom-6 right-6 md:bottom-auto md:top-[calc(var(--header-height)+16px)] w-72 h-14 rounded-lg' 
            : 'inset-0 md:inset-auto md:right-6 md:top-[calc(var(--header-height)+16px)] md:w-96 md:h-[60vh] md:max-h-[600px] md:rounded-xl'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${logs.some(l => l.level === 'error') ? 'bg-danger shadow-[0_0_8px_var(--color-danger)]' : 'bg-success shadow-[0_0_8px_var(--color-success)]'}`} />
             <span className="fe-hologram text-[9px] text-accent/40 uppercase tracking-[0.4em]">Neural_Diag_Link</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="text-fg-subtle hover:text-fg text-[7px] font-black uppercase tracking-widest px-2 py-1 transition-colors">
              {isMinimized ? '[Expand]' : '[Collapse]'}
            </button>
            <button onClick={() => setIsOpen(false)} className="text-danger/40 hover:text-danger text-[7px] font-black uppercase tracking-widest px-2 py-1 transition-colors">
              [Close]
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Scroll Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-fg-subtle/20 text-[9px] uppercase tracking-widest text-center px-8">
                   Link verified. No spectral anomalies detected.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between">
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                        log.level === 'error' ? 'bg-danger/10 text-danger' : 
                        log.level === 'warn' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-[7px] text-fg-subtle/20 font-mono italic">
                        {hasMounted ? new Date(log.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-fg/70 leading-relaxed font-mono break-all px-1 border-l border-white/5 ml-1">
                      {log.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-surface-elevated/50 flex gap-2">
               <button 
                 onClick={clearLogs}
                 className="flex-1 fe-btn !py-2 !text-[8px] !bg-surface-elevated !border-white/5 !text-fg-subtle/40 hover:!text-fg transition-all"
               >
                 Flush_Buffer
               </button>
               <button 
                 onClick={() => {
                   const text = logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.level.toUpperCase()}: ${l.message}`).join('\n');
                   navigator.clipboard.writeText(text);
                 }}
                 className="flex-1 fe-btn fe-btn-primary !py-2 !text-[8px]"
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
