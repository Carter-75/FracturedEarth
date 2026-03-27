# FRACTURED EARTH - Project TODO

Status legend: [ ] not started, [~] in progress, [x] done

## 0) Program Management
- [x] Create this checklist file as first action
- [ ] Define milestone plan (M1 foundation, M2 gameplay, M3 monetization, M4 release)
- [ ] Define branch/commit strategy and commit cadence
- [ ] Add progress update rules (update this file after each completed task)

## 1) Repository and Project Scaffold
- [x] Create multi-module Gradle Kotlin DSL project
- [x] Create required folders:
  - [x] /android-app
  - [x] /game-core
  - [x] /assets
  - [x] /themes
  - [x] /ui
  - [x] /ads
  - [x] /billing
  - [x] /build-scripts
  - [x] /docs
- [x] Configure Android SDK 34+, minSdk 26
- [x] Configure LibGDX integration for Android app embedding
- [x] Configure Compose + Material 3 (theme-token driven)

## 2) Core Game Architecture
- [ ] Define clean architecture boundaries:
  - [ ] Presentation (Compose + ViewModels)
  - [ ] Domain (game rules, bot strategies)
  - [ ] Data (Room, settings/subscription/theme state)
  - [ ] Rendering bridge (Compose <-> LibGDX)
- [ ] Define state models:
  - [ ] GameState, PlayerState, CardState, MatchState
  - [ ] TurnState, GlobalDisasterState
- [ ] Define game events/effects system
- [ ] Define deterministic RNG strategy (seeded for tests)

## 3) Gameplay Implementation
- [ ] Implement card taxonomy:
  - [x] Survival cards (25 unique designs)
  - [x] Disaster cards (25 unique, 4 kinds, negative pointsDelta)
  - [x] Trait cards (25 unique, permanent blockers)
  - [x] Adapt cards (25 unique, one-use blockers)
  - [x] Chaos cards (25 unique, GLOBAL effects)
- [x] Implement deck generation/shuffling (250 cards: 25 × 2 copies each)
- [x] Implement turn loop:
  - [x] Draw 1 card (drawForActivePlayer)
  - [x] Play up to 3 cards (enforced in GameViewModel)
  - [x] Resolve effects (GameEngine.playCard)
  - [x] End turn/next player (advanceTurn)
- [x] Implement global disaster phase every 3 rounds
- [x] Implement win conditions:
  - [x] 50 survival points
  - [x] Last civilization alive
- [x] Implement target resolution and valid target checks
- [x] Implement reaction window for Adapt cards (one-use ADAPT consumed on block)

## 3B) Multiplayer (KV + Local Wi-Fi)
- [x] Define multiplayer architecture for 2-4 players (hybrid cloud + LAN)
- [x] Add KV lobby repository foundation (create/join/leave/start/get lobby)
- [~] Add LAN discovery/service layer for local Wi-Fi room listing
- [x] Add local Wi-Fi room REST APIs in web app (`/api/lan/rooms/*`)
- [x] Add unified cross-platform room REST APIs (`/api/rooms/*`) backed by KV
- [x] Persist room game state in KV (`/api/rooms/[code]/state`) with revisions
- [x] Add server-authoritative room action API (`/api/rooms/[code]/action`)
- [x] Centralize multiplayer turn logic in one backend engine file (`web/lib/matchEngine.ts`)
- [x] Add Android LAN room client (`LanRoomClient`) targeting shared `/api/rooms/*`
- [x] Add multiplayer room UI flow (create room, join by code, LAN list)
- [~] Add host-authoritative command protocol for turn sync
- [ ] Add reconnect / stale lobby handling and host migration rules
- [ ] Add multiplayer instrumentation tests (2-4 player lobby lifecycle)

## 4) Bot AI
- [x] Define bot interface and action scoring model
- [x] Implement Easy bot (RandomStrategy)
- [x] Implement Medium bot (TargetLeaderStrategy)
- [x] Implement Hard bot (CounterTraitStrategy)
- [x] Wire bot execution loop in GameEngine.executeBotTurn()
- [x] Connect bot strategies to GameViewModel (difficulty → strategy map)
- [x] Add simulation tests for bot behavior correctness

## 5) Rendering and Input (LibGDX + Compose)
- [x] Implement 2.5D board scene with ~35 degree camera tilt
- [x] Implement performant card rendering/animations (baseline animated board + card motion)
- [ ] Implement touch interactions:
  - [x] Tap card to select/play
  - [ ] Tap target to play
  - [ ] Optional drag behavior
- [x] Implement chaos phase indicator on board/UI
- [ ] Add frame-time/memory instrumentation hooks

## 6) UI Screens and Navigation
- [x] Main Menu screen:
  - [x] Play
  - [x] Settings
  - [x] Exit
- [x] Game screen:
  - [x] Board viewport
  - [x] Hand area
  - [x] Traits area
  - [x] Score panel
  - [x] Turn/phase controls
- [x] Settings screen:
  - [x] Theme selector grid
- [x] Game Over screen:
  - [x] Winner summary
  - [x] Play Again
  - [x] Main Menu
- [x] Implement stable navigation graph and back behavior

## 7) Theme System
- [x] Create /themes/theme_tokens.kt
- [x] Define semantic token model:
  - [x] primary
  - [x] background
  - [x] cardSurface
  - [x] textPrimary
  - [x] textSecondary
  - [x] accent
  - [x] danger
  - [x] success
- [x] Implement 10 themes:
  - [x] Obsidian
  - [x] Deep Teal
  - [x] Electric Indigo
  - [x] Crimson Night
  - [x] Forest Signal
  - [x] Carbon Gold
  - [x] Arctic Terminal
  - [x] Solar Flare
  - [x] Void Purple
  - [x] Titanium Slate
- [~] Remove hardcoded UI colors and map all to tokens

## 8) UI Quality Rules
- [ ] Enforce 4px spacing scale in design system constants
- [x] Implement button states: default, hover/press animation, disabled, loading
- [ ] Validate color contrast accessibility targets
- [x] Maintain visual hierarchy and layered dark surfaces

## 9) Ads and Billing
- [x] Implement AdMob integration in /ads (scaffold)
- [x] Implement banner ad (bottom anchored)
- [x] Implement interstitial ads between matches only
- [~] Implement Play Billing in /billing (purchase/restore wiring scaffolded)
- [x] Add subscription product: Ad-Free Mode (screen + tier options)
- [x] Gate ad display based on active subscription
- [x] Add offline-safe ad fallback behavior

## 10) Persistence (Room)
- [x] Configure Room database
- [~] Add entities/DAOs for:
  - [x] settings
  - [x] selected theme (SelectedThemeEntity + ThemeDao)
  - [x] subscription cache (SubscriptionCacheEntity + SubscriptionCacheDao)
- [ ] Add repository layer with migration strategy (Room v1→v2 migration needed)

## 11) Security Hardening
- [ ] Follow OWASP ASVS mobile controls checklist
- [ ] Ensure no API keys or secrets committed
- [x] Load AdMob keys from local.properties
- [ ] Configure release signing placeholders and docs
- [x] Enable R8/ProGuard rules for obfuscation
- [ ] Add secure storage for sensitive local flags where needed

## 12) Observability and Reliability
- [ ] Integrate Timber structured logging
- [ ] Sanitize/reduce production logs
- [x] Firebase REMOVED — replaced with Vercel KV + RevenueCat + Google Auth
- [ ] Add crash-safe startup and global exception handling

## 13) Dependency and Supply Chain Security
- [x] Enable Gradle dependency locking
- [x] Add Dependabot config for Gradle/GitHub Actions
- [ ] Audit dependency licenses and versions

## 14) Testing
- [ ] Unit tests for game rules and card effects
- [ ] Unit tests for win conditions and chaos phase timing
- [ ] Unit tests for bot strategy behavior
- [ ] Instrumentation tests for navigation flow
- [ ] Instrumentation tests for theme switching persistence
- [ ] Add CI test tasks and baseline thresholds

## 15) CI/CD and Automation
- [x] Create scripts/web/build-and-deploy.sh with required steps
- [x] Add executable permissions guidance for Windows+Git Bash
- [x] Add CI workflow:
  - [x] build debug APK
  - [x] build release APK
  - [x] build release AAB
  - [x] run unit tests
  - [x] build Next.js web app (parallel CI job)
- [x] Archive build artifacts

## 16) Packaging and Verification
- [ ] Verify output paths:
  - [ ] /build/outputs/apk/debug
  - [ ] /build/outputs/apk/release
  - [ ] /build/outputs/bundle/release
- [ ] Verify APK installs and launches
- [ ] Verify AAB builds successfully
- [ ] Verify ads load (where available)
- [ ] Verify subscription removes ads
- [ ] Verify theme switching works end-to-end

## 17) Documentation
- [x] Add architecture doc in /docs
- [x] Add gameplay rules doc in /docs
- [x] Add ads/billing configuration doc in /docs
- [x] Add local setup + signing + release instructions
- [x] Add multiplayer architecture plan in /docs
- [x] Add web privacy policy page and policy links update
- [x] Add Vercel auto deploy and env setup doc

## 18) Git Operations
- [ ] Commit in small increments using required prefixes:
  - [ ] feature:
  - [ ] fix:
  - [ ] build:
  - [ ] ui:
  - [ ] gameplay:
- [ ] Final commit and push:
  - [ ] git add .
  - [ ] git commit -m "initial full build"
  - [ ] git push -u origin main

## Open Questions (Blocking)
- [x] Spec source locked -> current repo direction (no Firebase)
- [x] Android runtime mode -> keep Android auth/KV enabled
- [x] Multiplayer direction -> hybrid cloud + local Wi-Fi, 2-4 players
- [x] Worldwide real-player mode deferred; prioritize household Wi-Fi rooms now
- [x] Release verification in this pass -> code only
- [x] Git actions in this pass -> no git actions
- [x] Reference usage -> style/flow only, no copied code
- [x] Confirm package name (applicationId) -> com.fracturedearth
- [ ] Confirm app icon/branding assets
- [x] Confirm exact bot count -> user picks 1 to 3 bots
- [x] Confirm card set size and balancing targets -> 25 per category target
- [x] Firebase -> NO. Backend: Vercel KV (REST) + RevenueCat + Google OAuth
- [x] Confirm if AdMob app/ad unit IDs are available now -> use test IDs now
- [ ] Confirm if Play Billing product ID is available now -> pending
- [x] Confirm if I should initialize and push to existing remote immediately -> do not push yet
- [x] Confirm RevenueCat usage -> yes, use as entitlement source
- [x] Web app -> Next.js 14 scaffolded in /web with Vercel KV + NextAuth Google
- [ ] Confirm web app monetization implementation timeline (AdSense + web interstitial)
- [ ] Provide Vercel KV REST URL + token (from Vercel dashboard)
- [ ] Provide Google OAuth Web Client ID (from Google Cloud Console)
- [ ] Provide NEXTAUTH_SECRET for web (openssl rand -base64 32)
