'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { NativeBridge } from './nativeBridge';
import { loadLocalSettings, saveLocalSettings } from './localProfile';
import { apiFetch } from './api';

interface SubscriptionContextType {
  adFree: boolean;
  isLifetime: boolean;
  loading: boolean;
  refreshEntitlements: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [adFree, setAdFree] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateState = useCallback((isAdFree: boolean, lifetime: boolean) => {
    setAdFree(isAdFree);
    setIsLifetime(lifetime);
    
    // Persist to local settings
    const settings = loadLocalSettings();
    saveLocalSettings({ 
        ...settings, 
        adFree: isAdFree,
        isLifetime: lifetime,
        subLastCheck: Date.now() 
    });
  }, []);

  const syncWithServer = useCallback(async (data: { adFree: boolean; isLifetime: boolean; entitlements?: string[] }) => {
    if (status !== 'authenticated') return;
    try {
      await apiFetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('SubscriptionProvider: Entitlements synced to account.');
    } catch (e) {
      console.error('SubscriptionProvider: Server sync failed', e);
    }
  }, [status]);

  const refreshEntitlements = useCallback(async () => {
    if (NativeBridge.isNative) {
      console.log('SubscriptionProvider: Auto-restoring/Checking native entitlements...');
      try {
        const result = await NativeBridge.checkAdFreeEntitlement();
        updateState(result.adFree, result.isLifetime);
        
        if (status === 'authenticated') {
           await syncWithServer({ adFree: result.adFree, isLifetime: result.isLifetime });
        }
      } catch (e) {
        console.error('Native check failed', e);
      }
    } else if (status === 'authenticated') {
      console.log('SubscriptionProvider: Fetching account entitlements...');
      try {
        const res = await apiFetch('/api/user/sync');
        if (res.ok) {
           const data = await res.json();
           updateState(data.adFree, data.isLifetime);
        }
      } catch (e) {}
    }
  }, [status, updateState, syncWithServer]);

  useEffect(() => {
    const settings = loadLocalSettings();
    setAdFree(!!settings.adFree);
    setIsLifetime(!!settings.isLifetime);

    const init = async () => {
      setLoading(true);
      
      // 1. Sync User ID to RevenueCat if native
      if (NativeBridge.isNative && session?.user?.id) {
        await NativeBridge.syncUserId(session.user.id);
      }

      // 2. 24h Refresh Logic
      const lastCheck = settings.subLastCheck || 0;
      const needsRefresh = Date.now() - lastCheck > REFRESH_INTERVAL_MS;

      // Always refresh on native to stay in sync with App Store
      if (needsRefresh || NativeBridge.isNative) {
        await refreshEntitlements();
      }
      
      setLoading(false);
    };

    if (status !== 'loading') {
       init();
    }
  }, [status, session, refreshEntitlements]);

  return (
    <SubscriptionContext.Provider value={{ adFree, isLifetime, loading, refreshEntitlements }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
