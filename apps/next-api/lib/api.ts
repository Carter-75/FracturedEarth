export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fractured-earth.vercel.app';

import { addLog } from './logDiagnostics';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      addLog('warn', `API_FAILURE: ${res.status} ${res.statusText} at ${path}`);
    }
    return res;
  } catch (err: any) {
    addLog('error', `NETWORK_ERROR: ${err.message || 'Unknown Connection Fault'} at ${path}`);
    throw err;
  }
}
