package com.fracturedearth.ads

class AdsController(
    private val adConfig: AdConfig,
) {
    fun canShowBanner(isAdFree: Boolean): Boolean = adConfig.adsEnabled && !isAdFree

    fun canShowInterstitial(isAdFree: Boolean, isBetweenMatches: Boolean): Boolean {
        return adConfig.adsEnabled && !isAdFree && isBetweenMatches
    }
}
