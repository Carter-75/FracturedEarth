package com.fracturedearth.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local cache of RevenueCat entitlement status.
 * Source of truth remains RevenueCat; this cache prevents a network round-trip on cold start.
 */
@Entity(tableName = "subscription_cache")
data class SubscriptionCacheEntity(
    @PrimaryKey val id: Int = 0,    // single-row table
    val tier: String,               // "NONE" | "MONTHLY" | "YEARLY" | "LIFETIME"
    val expiresAtEpochMs: Long,     // 0 for NONE or LIFETIME
    val cachedAtEpochMs: Long,
)
