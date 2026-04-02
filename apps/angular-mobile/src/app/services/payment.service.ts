import { Injectable } from '@angular/core';
import { Purchases, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() {}

  /**
   * Fetch Active Offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current;
      }
    } catch (e) {
      console.error('Error fetching offerings', e);
    }
    return null;
  }

  /**
   * Purchase a Package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      if (customerInfo.entitlements.active["Fractured Earth Pro"]) {
        return true;
      }
    } catch (e) {
      console.error('Purchase failed', e);
    }
    return false;
  }

  /**
   * Restore Purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      return !!customerInfo.entitlements.active["Fractured Earth Pro"];
    } catch (e) {
      console.error('Restore failed', e);
      return false;
    }
  }

  /**
   * Check Entitlement Status
   */
  async isPro(): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active["Fractured Earth Pro"];
    } catch (e) {
      return false;
    }
  }
}
