# Architecture

## Modules
- android-app: Android entrypoint, Compose UI, ads, billing, Room, app lifecycle.
- game-core: deterministic game models, turn engine, and bot strategies.

## Layers
- Presentation: Compose screens and view state in android-app.
- Domain: card models and game engine in game-core.
- Data: Room key-value settings table for theme and entitlement cache.
- Platform integration: AdMob, RevenueCat, Play Billing, Google auth, Vercel KV wrappers.

## Multiplayer direction
- Hybrid multiplayer planned:
	- Cloud room coordination via Vercel KV.
	- Local Wi-Fi room mode (LAN discovery + room join path).
- Player counts: 2 to 4.

## Current status
- Baseline scaffold implemented.
- Core bots and game loop implemented.
- KV-backed lobby foundation added in android-app sync layer.
