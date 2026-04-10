'use client';

import { Capacitor } from '@capacitor/core';
import { Purchases, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { AdMob } from '@capacitor-community/admob';

export const REVENUECAT_API_KEY = 'test_MIAdeZbJZTOYchrbHnqlaKoeggM';

/**
 * Official Google AdMob IDs (Android/iOS)
 */
export const ADMOB_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  }
};

export function getAdUnitId(type: 'banner' | 'interstitial') {
  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  if (platform === 'web') return null;
  return ADMOB_IDS[platform]?.[type] || ADMOB_IDS.android[type];
}

let adMobInitialized = false;

export async function initializeNativeBridge() {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    try {
      console.log('Initializing Native Bridge: RevenueCat...');
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      // Set debug logs only in non-prod (simulated here)
      await Purchases.setLogLevel({ level: 'DEBUG' });
      console.log('RevenueCat configured successfully.');

      console.log('Initializing Native Bridge: AdMob...');
      await AdMob.initialize({
        initializeForTesting: true,
      });
      adMobInitialized = true;
      console.log('AdMob initialized successfully.');
    } catch (e) {
      console.error('Failed to initialize native bridge', e);
    }
  }

  return {
    isAvailable: isNative,
    platform: Capacitor.getPlatform(),
    adMobReady: adMobInitialized,
  };
}

/**
 * Handle Native Auth / Ads / IAP
 */
export const NativeBridge = {
  purchases: Purchases,
  isNative: Capacitor.isNativePlatform(),
  getAdUnitId,
  isAdMobReady: () => adMobInitialized,
  
  /**
   * Check if a customer has an active ad-free entitlement
   */
  async checkAdFreeEntitlement(): Promise<{ adFree: boolean; isLifetime: boolean }> {
    if (!this.isNative) return { adFree: false, isLifetime: false };
    try {
      const info = await Purchases.getCustomerInfo();
      const entitlements = info.entitlements.active;
      
      const hasLifetime = !!entitlements['eternal_protocol'] || !!entitlements['lifetime'];
      const hasStandard = !!entitlements['standard_sync'] || !!entitlements['strategic_pulse'] || !!entitlements['ad_free'];
      
      return {
        adFree: hasLifetime || hasStandard,
        isLifetime: hasLifetime
      };
    } catch (e) {
      console.error('Error checking entitlements', e);
      return { adFree: false, isLifetime: false };
    }
  },

  /**
   * Sync local user ID to RevenueCat for cross-platform matching
   */
  async syncUserId(userId: string) {
    if (!this.isNative || !userId) return;
    try {
      await Purchases.logIn({ appUserID: userId });
      console.log(`RevenueCat synced with User ID: ${userId}`);
    } catch (e) {
       console.error('RevenueCat sync failed', e);
    }
  }
};
