'use client';

import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { AdMob } from '@capacitor-community/admob';

export const REVENUECAT_API_KEY = 'test_MIAdeZbJZTOYchrbHnqlaKoeggM';

export interface NativeBridgeState {
  isAvailable: boolean;
  platform: string;
  adMobReady: boolean;
}

/**
 * Official Google AdMob Test Unit IDs
 */
export const ADMOB_TEST_IDS = {
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
  return ADMOB_TEST_IDS[platform]?.[type] || ADMOB_TEST_IDS.android[type];
}

let adMobInitialized = false;

export async function initializeNativeBridge() {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    try {
      console.log('Initializing Native Bridge: RevenueCat...');
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
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
};
