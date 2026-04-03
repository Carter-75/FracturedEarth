import { Injectable } from '@angular/core';
import { Purchases, PurchasesOffering, PurchasesPackage, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private _isPro = new BehaviorSubject<boolean>(false);
  public isPro$ = this._isPro.asObservable();

  private _offerings = new BehaviorSubject<PurchasesOffering | null>(null);
  public offerings$ = this._offerings.asObservable();

  // IMPORTANT: Update this once you create your "Pro" entitlement in RevenueCat
  private ENTITLEMENT_ID = "pro"; 

  constructor() {}

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(apiKey: string) {
    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey });
      
      // Update data initially
      await this.refreshData();

      // Listen for updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.updateProStatus(info);
      });
    } catch (e) {
      console.error('RevenueCat Init Failed', e);
    }
  }

  /**
   * Refresh offerings and entitlement status
   */
  async refreshData() {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.updateProStatus(customerInfo);

      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        this._offerings.next(offerings.current);
      }
    } catch (e) {
      console.error('Data refresh failed', e);
    }
  }

  private updateProStatus(customerInfo: any) {
    const isActive = !!customerInfo.entitlements.active[this.ENTITLEMENT_ID];
    this._isPro.next(isActive);
    console.log(`[RevenueCat] Pro Status: ${isActive}`);
  }

  /**
   * Purchase a specific package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      this.updateProStatus(customerInfo);
      return this._isPro.value;
    } catch (e) {
      console.error('Purchase failed', e);
      return false;
    }
  }

  async login(userId: string) {
    try {
      const { customerInfo } = await Purchases.logIn({ appUserID: userId });
      this.updateProStatus(customerInfo);
    } catch (e) {
      console.error('RevenueCat Login Failed', e);
    }
  }
  
  async logout() {
    try {
      const { customerInfo } = await Purchases.logOut();
      this.updateProStatus(customerInfo);
    } catch (e) {
      console.error('RevenueCat Logout Failed', e);
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      this.updateProStatus(customerInfo);
      return this._isPro.value;
    } catch (e) {
      console.error('Restore failed', e);
      return false;
    }
  }
}
