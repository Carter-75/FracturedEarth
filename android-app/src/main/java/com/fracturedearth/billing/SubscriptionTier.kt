package com.fracturedearth.billing

enum class SubscriptionTier(
    val productId: String,
) {
    MONTHLY("fracturedearth_adfree_monthly"),
    YEARLY("fracturedearth_adfree_yearly"),
    LIFETIME("fracturedearth_adfree_lifetime"),
}
