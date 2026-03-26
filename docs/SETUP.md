# Setup

## Prerequisites
- Android Studio / SDK 34
- JDK 17

## Secrets
Create local.properties in repo root and set:

sdk.dir=YOUR_ANDROID_SDK_PATH
ADMOB_BANNER_AD_UNIT=ca-app-pub-3940256099942544/6300978111
ADMOB_INTERSTITIAL_AD_UNIT=ca-app-pub-3940256099942544/1033173712
REVENUECAT_PUBLIC_KEY=
LAN_ROOM_SERVER_URL=

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
