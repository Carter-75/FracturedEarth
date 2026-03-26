package com.fracturedearth.ads

import com.fracturedearth.BuildConfig

data class AdConfig(
    val bannerAdUnit: String = BuildConfig.ADMOB_BANNER_AD_UNIT,
    val interstitialAdUnit: String = BuildConfig.ADMOB_INTERSTITIAL_AD_UNIT,
    val adsEnabled: Boolean = true,
)
