import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use { load(it) }
    }
}

fun localValue(key: String, fallback: String): String {
    return localProperties.getProperty(key) ?: fallback
}

android {
    namespace = "com.fracturedearth"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.fracturedearth"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true

        buildConfigField(
            "String",
            "ADMOB_BANNER_AD_UNIT",
            "\"${localValue("ADMOB_BANNER_AD_UNIT", "ca-app-pub-3940256099942544/6300978111")}\""
        )
        buildConfigField(
            "String",
            "ADMOB_INTERSTITIAL_AD_UNIT",
            "\"${localValue("ADMOB_INTERSTITIAL_AD_UNIT", "ca-app-pub-3940256099942544/1033173712")}\""
        )
        buildConfigField(
            "String",
            "REVENUECAT_PUBLIC_KEY",
            "\"${localValue("REVENUECAT_PUBLIC_KEY", "")}\""
        )
        buildConfigField(
            "String",
            "VERCEL_KV_REST_URL",
            "\"${localValue("VERCEL_KV_REST_URL", "")}\""
        )
        buildConfigField(
            "String",
            "VERCEL_KV_REST_TOKEN",
            "\"${localValue("VERCEL_KV_REST_TOKEN", "")}\""
        )
        buildConfigField(
            "String",
            "GOOGLE_WEB_CLIENT_ID",
            "\"${localValue("GOOGLE_WEB_CLIENT_ID", "")}\""
        )
        buildConfigField(
            "String",
            "LAN_ROOM_SERVER_URL",
            "\"${localValue("LAN_ROOM_SERVER_URL", "")}\""
        )
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    implementation(project(":game-core"))

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("androidx.fragment:fragment-ktx:1.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    implementation("androidx.compose.ui:ui:1.6.8")
    implementation("androidx.compose.ui:ui-tooling-preview:1.6.8")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("com.google.android.material:material:1.12.0")

    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")

    implementation("com.jakewharton.timber:timber:5.0.1")

    implementation("com.google.android.gms:play-services-ads:23.3.0")
    implementation("com.android.billingclient:billing-ktx:7.0.0")
    implementation("com.revenuecat.purchases:purchases:8.9.0")

    implementation("com.badlogicgames.gdx:gdx:1.12.1")
    implementation("com.badlogicgames.gdx:gdx-backend-android:1.12.1")

    // Google Sign-In
    implementation("com.google.android.gms:play-services-auth:21.2.0")

    // Vercel KV REST client
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.6.8")
    debugImplementation("androidx.compose.ui:ui-tooling:1.6.8")
}
