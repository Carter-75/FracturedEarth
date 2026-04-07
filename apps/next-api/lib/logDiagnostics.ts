'use client';

export type LogEntry = {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
};

type LogObserver = (logs: LogEntry[]) => void;

let logs: LogEntry[] = [];
let observers: LogObserver[] = [];

export function initializeNeuralLogging() {
  if (typeof window === 'undefined') return;
  
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    addLog('error', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    originalError(...args);
  };

  console.warn = (...args: any[]) => {
    addLog('warn', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    originalWarn(...args);
  };
}

export function addLog(level: LogEntry['level'], message: string) {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random()}`,
    level,
    message,
    timestamp: Date.now(),
  };
  logs = [entry, ...logs].slice(0, 50); // Keep last 50
  observers.forEach(obs => obs(logs));
}

export function subscribeToLogs(obs: LogObserver) {
  observers.push(obs);
  obs(logs);
  return () => {
    observers = observers.filter(o => o !== obs);
  };
}

export function clearLogs() {
  logs = [];
  observers.forEach(obs => obs(logs));
}

export function getLogs() {
  return logs;
}
