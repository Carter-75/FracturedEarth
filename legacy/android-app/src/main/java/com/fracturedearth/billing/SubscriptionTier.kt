package com.fracturedearth.billing

enum class SubscriptionTier(
    val productId: String,
) {
    MONTHLY("monthly"),
    YEARLY("yearly"),
    LIFETIME("lifetime"),
}
