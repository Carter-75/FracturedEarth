package com.fracturedearth.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ThemeDao {
    @Query("SELECT * FROM selected_theme WHERE id = 0 LIMIT 1")
    suspend fun getTheme(): SelectedThemeEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setTheme(entity: SelectedThemeEntity)
}

@Dao
interface SubscriptionCacheDao {
    @Query("SELECT * FROM subscription_cache WHERE id = 0 LIMIT 1")
    suspend fun getCache(): SubscriptionCacheEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setCache(entity: SubscriptionCacheEntity)
}
