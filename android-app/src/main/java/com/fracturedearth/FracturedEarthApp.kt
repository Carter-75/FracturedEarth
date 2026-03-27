package com.fracturedearth

import android.app.Application
import com.fracturedearth.billing.BillingFacade
import com.google.android.gms.ads.MobileAds
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration
import com.revenuecat.purchases.LogLevel
import timber.log.Timber

class FracturedEarthApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }

        MobileAds.initialize(this)

        if (BuildConfig.REVENUECAT_PUBLIC_KEY.isNotBlank()) {
            Purchases.logLevel = if (BuildConfig.DEBUG) LogLevel.DEBUG else LogLevel.WARN
            Purchases.configure(
                PurchasesConfiguration.Builder(this, BuildConfig.REVENUECAT_PUBLIC_KEY)
                    .build()
            )
            BillingFacade.refreshEntitlementCache()
        } else {
            Timber.w("RevenueCat public key is blank; ad-free entitlement sync disabled")
        }
    }
}
