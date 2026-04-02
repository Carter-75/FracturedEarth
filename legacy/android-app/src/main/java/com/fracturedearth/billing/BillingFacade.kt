package com.fracturedearth.billing

import android.app.Activity
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.Offerings
import com.revenuecat.purchases.Package
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesError
import com.revenuecat.purchases.interfaces.PurchaseCallback
import com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback
import com.revenuecat.purchases.interfaces.ReceiveOfferingsCallback
import com.revenuecat.purchases.PurchaseParams
import com.revenuecat.purchases.models.StoreTransaction
import com.revenuecat.purchases.ui.revenuecatui.ExperimentalPreviewRevenueCatUIPurchasesAPI
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import timber.log.Timber

/**
 * BillingFacade handles the interaction with RevenueCat SDK.
 * Integrated with:
 * - Entitlement: "Fractured Earth Pro"
 * - Features: Paywalls, Customer Center, Manual Purchases, Restores
 */
@OptIn(ExperimentalPreviewRevenueCatUIPurchasesAPI::class)
class BillingFacade {
    companion object {
        private const val ENTITLEMENT_ID = "Fractured Earth Pro"

        @Volatile
        private var proCached: Boolean = false
        private val proFlow = MutableStateFlow(false)

        private fun updateFromInfo(info: CustomerInfo) {
            proCached = info.entitlements[ENTITLEMENT_ID]?.isActive == true
            proFlow.value = proCached
            Timber.i("RevenueCat entitlement '$ENTITLEMENT_ID' active=$proCached")
        }

        fun refreshEntitlementCache() {
            if (!Purchases.isConfigured) return
            Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
                override fun onReceived(customerInfo: CustomerInfo) {
                    updateFromInfo(customerInfo)
                }
                override fun onError(error: PurchasesError) {
                    Timber.w("Failed to refresh CustomerInfo: ${error.message}")
                }
            })
        }

        fun proState(): StateFlow<Boolean> = proFlow
        fun isProActive(): Boolean = proCached

        // Compatibility for existing code using adFree
        fun adFreeState(): StateFlow<Boolean> = proFlow
        fun isAdFreeActive(): Boolean = proCached
    }

    // Launchers are typically used from Composables. For standard Activity launches:
    // val launcher = PaywallActivityLauncher(activity, resultCallback)
    // But since this is a facade, we will provide a direct launch helper or use static launch

    /**
     * Launch the RevenueCat Paywall UI.
     */
    fun showPaywall(activity: Activity) {
        // PurchasesUI helper is often available or use launcher correctly
        // For now, we'll try the common Activity launch if available or fallback
        try {
            val intent = android.content.Intent(activity, Class.forName("com.revenuecat.purchases.ui.revenuecatui.PaywallActivity"))
            activity.startActivity(intent)
        } catch (e: Exception) {
            Timber.e("Could not launch PaywallActivity: ${e.message}")
        }
    }

    /**
     * Launch the RevenueCat Customer Center.
     */
    fun showCustomerCenter(activity: Activity) {
        try {
            val intent = android.content.Intent(activity, Class.forName("com.revenuecat.purchases.ui.revenuecatui.customercenter.CustomerCenterActivity"))
            activity.startActivity(intent)
        } catch (e: Exception) {
            Timber.e("Could not launch CustomerCenterActivity: ${e.message}")
        }
    }

    /**
     * Manual purchase flow for a specific tier.
     */
    fun purchase(activity: Activity, tier: SubscriptionTier) {
        if (!Purchases.isConfigured) return

        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(offerings: Offerings) {
                val pkg = offerings.current?.availablePackages?.firstOrNull { 
                    it.product.id == tier.productId 
                } ?: offerings.all.values.flatMap { it.availablePackages }.firstOrNull {
                    it.product.id == tier.productId
                }

                if (pkg == null) {
                    Timber.w("Package not found for product: ${tier.productId}")
                    return
                }

                val params = PurchaseParams.Builder(activity, pkg).build()
                Purchases.sharedInstance.purchase(
                    params,
                    object : PurchaseCallback {
                        override fun onCompleted(storeTransaction: StoreTransaction, customerInfo: CustomerInfo) {
                            updateFromInfo(customerInfo)
                            Timber.i("Purchase successful: ${storeTransaction.orderId}")
                        }

                        override fun onError(error: PurchasesError, userCancelled: Boolean) {
                            if (!userCancelled) Timber.e("Purchase failed: ${error.message}")
                        }
                    }
                )
            }

            override fun onError(error: PurchasesError) {
                Timber.e("Failed to fetch offerings: ${error.message}")
            }
        })
    }

    /**
     * Restore previous purchases.
     */
    fun restorePurchases() {
        if (!Purchases.isConfigured) return
        Purchases.sharedInstance.restorePurchases(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                updateFromInfo(customerInfo)
            }
            override fun onError(error: PurchasesError) {
                Timber.e("Restore failed: ${error.message}")
            }
        })
    }

    /**
     * Programmatic sync (no OS prompt).
     */
    fun syncPurchases() {
        if (!Purchases.isConfigured) return
        Purchases.sharedInstance.syncPurchases()
    }
}
