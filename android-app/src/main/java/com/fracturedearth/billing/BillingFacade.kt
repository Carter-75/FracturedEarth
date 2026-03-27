package com.fracturedearth.billing

import android.app.Activity
import com.fracturedearth.BuildConfig
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.Offerings
import com.revenuecat.purchases.Package
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesError
import com.revenuecat.purchases.interfaces.PurchaseCallback
import com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback
import com.revenuecat.purchases.interfaces.ReceiveOfferingsCallback
import com.revenuecat.purchases.models.StoreTransaction
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import timber.log.Timber

class BillingFacade {
    companion object {
        @Volatile
        private var adFreeCached: Boolean = false
        private val adFreeFlow = MutableStateFlow(false)

        private fun entitlementId(): String = BuildConfig.REVENUECAT_ADFREE_ENTITLEMENT

        private fun updateFromInfo(info: CustomerInfo) {
            adFreeCached = info.entitlements.active.containsKey(entitlementId())
            adFreeFlow.value = adFreeCached
            Timber.i("RevenueCat entitlement '${entitlementId()}' active=$adFreeCached")
        }

        private fun updateFromCustomerInfo() {
            if (!Purchases.isConfigured) return
            Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
                override fun onReceived(customerInfo: CustomerInfo) {
                    updateFromInfo(customerInfo)
                }

                override fun onError(error: PurchasesError) {
                    Timber.w("Failed to refresh RevenueCat customer info: ${error.message}")
                }
            })
        }

        fun refreshEntitlementCache() {
            updateFromCustomerInfo()
        }

        fun adFreeState(): StateFlow<Boolean> = adFreeFlow
    }

    fun purchase(activity: Activity, tier: SubscriptionTier) {
        if (!Purchases.isConfigured) {
            Timber.w("RevenueCat is not configured; purchase disabled")
            return
        }

        Timber.i("Starting purchase flow for ${tier.productId}")
        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(offerings: Offerings) {
                val current = offerings.current
                if (current == null) {
                    Timber.w("No current RevenueCat offering found")
                    return
                }

                val selectedPackage = current.availablePackages.firstOrNull { pkg ->
                    pkg.product.id == tier.productId
                }

                if (selectedPackage == null) {
                    Timber.w("No package matched productId=${tier.productId}. Available=${current.availablePackages.map { it.product.id }}")
                    return
                }

                Purchases.sharedInstance.purchasePackage(activity, selectedPackage, object : PurchaseCallback {
                    override fun onCompleted(storeTransaction: StoreTransaction, customerInfo: CustomerInfo) {
                        updateFromInfo(customerInfo)
                        Timber.i("Purchase success; transaction=${storeTransaction.orderId}")
                    }

                    override fun onError(error: PurchasesError, userCancelled: Boolean) {
                        if (userCancelled) {
                            Timber.i("Purchase cancelled by user")
                        } else {
                            Timber.w("Purchase failed: ${error.message}")
                        }
                    }
                })
            }

            override fun onError(error: PurchasesError) {
                Timber.w("Failed loading offerings: ${error.message}")
            }
        })
    }

    fun restorePurchases() {
        if (!Purchases.isConfigured) {
            Timber.w("RevenueCat is not configured; restore disabled")
            return
        }

        Timber.i("Attempting restore purchase flow")
        Purchases.sharedInstance.restorePurchases(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                updateFromInfo(customerInfo)
                Timber.i("Restore complete")
            }

            override fun onError(error: PurchasesError) {
                Timber.w("Restore purchases failed: ${error.message}")
            }
        })
    }

    fun isAdFreeActive(): Boolean {
        return adFreeCached
    }
}
