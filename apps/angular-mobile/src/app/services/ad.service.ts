import { Injectable } from '@angular/core';
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { PaymentService } from './payment.service';
import { take } from 'rxjs/operators';

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
    const isPro = await this.paymentService.isPro$.pipe(take(1)).toPromise();
    if (isPro) return;

    const options: BannerAdOptions = {
        adId: 'ca-app-pub-3940256099942544/6300978111', 
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
    };
    await AdMob.showBanner(options);
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
