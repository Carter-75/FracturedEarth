import { Injectable } from '@angular/core';
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { PaymentService } from './payment.service';
import { take } from 'rxjs/operators';
import { CONFIG } from '../config';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  public adInitialized = false;

  constructor(private paymentService: PaymentService) {
    // Reactive Gating: Auto-hide ads if user is Pro
    this.paymentService.isPro$.subscribe(isPro => {
      if (isPro) {
        this.hideAllAds();
      } else {
        this.initializeAds();
      }
    });
  }

  async initializeAds() {
    if (!Capacitor.isNativePlatform() || this.adInitialized) return;
    
    try {
      await AdMob.initialize({
        initializeForTesting: true,
      });
      this.adInitialized = true;
      await this.showBanner();
    } catch (e) {
      console.error('AdMob Init Failed', e);
    }
  }

  async showBanner() {
    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService] Web Banner ID:', CONFIG.adSense.bannerId);
      return;
    }

    const adId = CONFIG.adMob.bannerId;
    const options: BannerAdOptions = {
        adId: adId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: adId.includes('3940256099942544'),
    };
    await AdMob.showBanner(options);
  }

  /**
   * Show Interstitial ("Intertweller") Ad
   */
  async showInterstitial() {
    const isPro = await this.paymentService.isPro$.pipe(take(1)).toPromise();
    if (isPro) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const adId = CONFIG.adMob.interstitialId;
        const options: AdOptions = {
          adId: adId,
          isTesting: adId.includes('3940256099942544'),
        };
        await AdMob.prepareInterstitial(options);
        await AdMob.showInterstitial();
      } catch (e) {
        console.error('Interstitial failed', e);
      }
    } else {
      console.log('[AdService] Web Interstitial ID:', CONFIG.adSense.interstitialId);
    }
  }

  async hideAllAds() {
    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.hideBanner();
        await AdMob.removeBanner();
      } catch (e) {}
    }
    const adsenseElements = document.querySelectorAll('.adsbygoogle');
    adsenseElements.forEach(el => el.remove());
  }
}
