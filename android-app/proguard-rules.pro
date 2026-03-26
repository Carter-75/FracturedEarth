# Keep Room generated classes
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *

# Keep RevenueCat entry points
-keep class com.revenuecat.** { *; }
-dontwarn com.revenuecat.**

# Keep GDX classes used by reflection
-keep class com.badlogic.gdx.** { *; }
-dontwarn com.badlogic.gdx.**
