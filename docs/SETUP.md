# Setup

## Prerequisites
- Android Studio / SDK 34
- JDK 17

## Secrets
Create local.properties in repo root and set:

sdk.dir=YOUR_ANDROID_SDK_PATH
ADMOB_APP_ID=ca-app-pub-3940256099942544~3347511713
ADMOB_BANNER_AD_UNIT=ca-app-pub-3940256099942544/6300978111
ADMOB_INTERSTITIAL_AD_UNIT=ca-app-pub-3940256099942544/1033173712
ADMOB_APP_ID_RELEASE=
ADMOB_BANNER_AD_UNIT_RELEASE=
ADMOB_INTERSTITIAL_AD_UNIT_RELEASE=
REVENUECAT_PUBLIC_KEY=
REVENUECAT_ADFREE_ENTITLEMENT=ad_free
LAN_ROOM_SERVER_URL=

For production, set the `_RELEASE` AdMob values to your real AdMob IDs. If release IDs are blank, ads are disabled in release builds.

## Release signing
Create `keystore.properties` (repo root) for signed production artifacts:

storeFile=path/to/your-upload-key.jks
storePassword=***
keyAlias=upload
keyPassword=***

If signing values are missing, release artifacts are built without signing config.

## Build
./gradlew assembleDebug
./gradlew assembleRelease
./gradlew bundleRelease

## Local Wi-Fi cross-platform rooms
- Start web app host on one LAN device (`cd web && npm run dev`).
- Set `LAN_ROOM_SERVER_URL` in Android `local.properties` to that host URL (for example `http://192.168.1.42:3000`).
- Use the web LAN room page at `/lan` and Android LAN client against the same URL.

## Production auto deploy
- See `docs/VERCEL_AUTODEPLOY.md` for Vercel project setup and required environment variables.
