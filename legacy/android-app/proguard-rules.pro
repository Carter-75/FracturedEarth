# [Fractured Earth] Proguard Hardening (V3)
# These rules prevent R8 from stripping away critical logic in Release builds.

# 1. Room Persistence
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep class * extends androidx.room.Entity
-dontwarn androidx.room.**

# 2. Kotlin Serialization (ESSENTIAL)
-keepattributes *Annotation*, EnclosingMethod, InnerClasses, Signature
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}
-keepclassmembers class ** {
    @kotlinx.serialization.Transient *;
}
# Keep the generated serializers
-keep class **$$serializer { *; }
-keepclassmembers class ** {
    *** Companion;
}
-keep class kotlinx.serialization.json.** { *; }
-dontwarn kotlinx.serialization.**

# 3. Game Core (Models, Engine & Bot Logic)
# We preserve the entire core package to ensure game logic and state mapping works.
-keep class com.fracturedearth.core.model.** { *; }
-keep class com.fracturedearth.core.engine.** { *; }
-keep class com.fracturedearth.core.bot.** { *; }
-keep class com.fracturedearth.game.** { *; }

# 4. LibGDX Engine
-keep class com.badlogic.gdx.** { *; }
-dontwarn com.badlogic.gdx.**

# 5. RevenueCat Billing
-keep class com.revenuecat.** { *; }
-dontwarn com.revenuecat.**

# 6. OkHttp & Networking (Leaderboard Sync)
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# 7. Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.coroutines.android.HandlerContext {
    variable name;
}
-dontwarn kotlinx.coroutines.**

# 8. Timber Logging
-keep class timber.log.** { *; }

# 9. Google Sign-In & Auth
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.signin.** { *; }
-keep class com.google.android.gms.common.** { *; }

# 10. Android X & Compose
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**
