package com.fracturedearth.billing

import timber.log.Timber

class BillingFacade {
    fun purchase(tier: SubscriptionTier) {
        Timber.i("Starting purchase flow for ${tier.productId}")
        // Billing + RevenueCat purchase flow will be added with final Play Console product setup.
    }

    fun restorePurchases() {
        Timber.i("Attempting restore purchase flow")
        // Billing + RevenueCat restore flow will be added with real keys and product setup.
    }

    fun isAdFreeActive(): Boolean {
        // Placeholder: resolve entitlement from RevenueCat customer info.
        return false
    }
}
