'use client';

import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';

export const REVENUECAT_API_KEY = 'test_MIAdeZbJZTOYchrbHnqlaKoeggM';

export interface NativeBridgeState {
  isAvailable: boolean;
  platform: string;
}

export async function initializeNativeBridge() {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    try {
      console.log('Initializing Native Bridge: RevenueCat...');
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      console.log('RevenueCat configured successfully.');
    } catch (e) {
      console.error('Failed to initialize native bridge', e);
    }
  }

  return {
    isAvailable: isNative,
    platform: Capacitor.getPlatform(),
  };
}

/**
 * Trigger Haptic Feedback (via Capacitor)
 */
export async function triggerHaptic() {
  if (Capacitor.isNativePlatform()) {
     // Optional: require @capacitor/haptics
  }
}

/**
 * Handle Native Auth / Ads / IAP
 */
export const NativeBridge = {
  purchases: Purchases,
  isNative: Capacitor.isNativePlatform(),
};
