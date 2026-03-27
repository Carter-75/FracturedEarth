# FRACTURED EARTH

A Chaos Survival Card Game.

## What Is Built
- Android app in Kotlin + Jetpack Compose + LibGDX embedded tabletop renderer.
- Full game flow screens: Main Menu, Game, Settings, Subscription, Game Over.
- Theme system with 10 selectable themes mapped through semantic tokens.
- Bot-based match setup (1-3 bots, difficulty selection: Easy/Medium/Hard).
- Card gameplay engine with 25 unique cards per category and turn resolution.
- Ad monetization scaffolding: bottom banner slot + interstitial between matches.
- Ad-Free subscription page and restore-purchases flow scaffolding.
- Web companion scaffold in `web/` (Next.js + NextAuth + Vercel KV).

## Modules
- `android-app`: Android app shell, Compose UI, embedded LibGDX board, ads, billing stubs.
- `game-core`: Shared gameplay rules, card catalog, bot strategies, turn engine.
- `web`: Next.js companion for auth/profile/leaderboard scaffolding.

## Android UX Highlights
- Main Menu includes commander name, bot count, and difficulty controls.
- Game screen includes:
  - animated status panel
  - 3D angled tabletop board viewport (LibGDX)
  - interactive hand strip
  - draw/end-turn/end-match controls
  - menu/settings access
  - dedicated banner ad space
- Settings screen includes live theme switching and subscription entrypoint.
- Game Over includes animated winner summary and replay/main menu navigation.

## 3D Tabletop Rendering
The board uses LibGDX with:
- perspective camera angle (~35 degree tilt)
- directional + ambient lighting
- animated island-like board pieces
- animated card planes for visual motion

Files:
- `android-app/src/main/java/com/fracturedearth/render/FracturedEarthBoardScreen.kt`
- `android-app/src/main/java/com/fracturedearth/render/FracturedEarthBoardFragment.kt`
- `android-app/src/main/java/com/fracturedearth/ui/component/LibGdxBoardView.kt`

## Monetization
- Banner ad slot: anchored in the game screen footer region.
- Interstitial ad: triggered at match boundary (Game -> Game Over).
- Subscription screen (`Ad-Free Mode`) for monthly/yearly/lifetime tiers.

Current status:
- Ad rendering flow is wired with test ad IDs.
- Purchase/restore calls are scaffolded through `BillingFacade`; final Play Console product wiring remains.

## Local Setup
1. Copy `local.properties.example` to `local.properties`.
2. Set `sdk.dir` to your local Android SDK path.
3. Fill keys as needed:
	- `ADMOB_BANNER_AD_UNIT`
	- `ADMOB_INTERSTITIAL_AD_UNIT`
	- `REVENUECAT_PUBLIC_KEY`
	- `VERCEL_KV_REST_URL`
	- `VERCEL_KV_REST_TOKEN`
	- `GOOGLE_WEB_CLIENT_ID`
4. Build:
	- `./gradlew assembleDebug`

## Build & Push Script
Use:
- `scripts/web/build-and-deploy.ps1` (Windows)
- `scripts/web/build-and-deploy.sh` (bash)

It will:
- clean
- build debug APK
- build release APK
- build release AAB
- commit changes
- push to `main` by default
- skip push only when using the no-push flags
