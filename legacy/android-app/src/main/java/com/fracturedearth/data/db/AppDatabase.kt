package com.fracturedearth.data.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        AppSettingEntity::class,
        SelectedThemeEntity::class,
        SubscriptionCacheEntity::class,
    ],
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun settingsDao(): SettingsDao
    abstract fun themeDao(): ThemeDao
    abstract fun subscriptionCacheDao(): SubscriptionCacheDao
}
