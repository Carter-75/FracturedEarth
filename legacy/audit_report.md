# Fractured Earth: Comprehensive Repository Audit

This audit follows the exhaustive review of the "Fractured Earth" monorepo, covering the Next.js web application, shared TypeScript logic, and Android/Kotlin stubs.

## 1. Broken & Buggy Features

- **Turn Flow Rigidity**: [matchEngine.ts:321](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/matchEngine.ts#L321) (`applyMatchAction`). The current logic enforces a strict point-based combat loop. It lacks the fluid "Uno-like" matching mechanics (matching by color/type) which results in a static gameplay experience.
- **Polling Latency**: [page.tsx:197](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx#L197) (`setTimeout(tick, 1500)`). The 1.5s polling creates a noticeable "desync" feeling during high-speed transitions.
- **Heartbeat Mismatch**: [page.tsx:192](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx#L192) (10s pulse) vs [rooms.ts:6](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/rooms.ts#L6) (60s timeout). This leads to rooms staying "OPEN" well after a host has crashed or closed the tab.
- **Card Collision**: [page.tsx:524](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx#L524) (`rotate`, `translateY`). The "fanned" cards can overlap in ways that make selecting specific cards difficult on mobile-sized viewports.

## 2. Incomplete & Half-Built Features

- **Settings Image Logic**: [settings/page.tsx:50](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/settings/page.tsx#L50). Contains placeholder comments for AI-generated assets but lacks the actual implementation or asset paths.
- **Tutorial Integration**: [TutorialLaunchGate.tsx:1](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/components/TutorialLaunchGate.tsx). Functional but exists as a "blocker" rather than an integrated onboarding experience.
- **Android Module Integration**: [APP_RULES.md:40](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/APP_RULES.md#L40). Core game logic is duplicated in [matchEngine.ts](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/matchEngine.ts) instead of being truly shared via a common Kotlin/TS bridge or WASM layer as implied by the monorepo rules.
- **Match Outcomes**: [localProfile.ts:11](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/localProfile.ts#L11). The system is basic and doesn't track advanced stats (cards played, types used).

## 3. UI/UX Problems

- **Aesthetic Inconsistency**: 
    - Main Menu: [app/page.tsx](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/page.tsx) uses a "luxury card game" style.
    - Tabletop: [tabletop/[code]/page.tsx](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx) uses a "3D arena" style.
    - Settings: [settings/page.tsx](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/settings/page.tsx) uses a "flat SaaS" style.
- **Typography**: [globals.css:12](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/globals.css#L12) (Inter). While "Inter" is specified, it isn't consistently used with the geometric weighting requested.
- **Spacing Grid**: [globals.css](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/globals.css). The 4px grid rule is frequently violated (e.g., `p-8`, `gap-3` in various page files).
- **Interaction Feedback**: [page.tsx](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx). Buttons lack premium hover/active micro-animations. Card movements are simple CSS transitions rather than "flying" physics-based animations.

## 4. API & Backend Deficiencies

- **Redundant Room Systems**: [rooms.ts](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/rooms.ts) vs [lanRooms.ts](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/lanRooms.ts). `lanRooms.ts` will vanish on Vercel cold starts.
- **Validation**: [api/rooms/[code]/action/route.ts](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/api/rooms/[code]/action/route.ts). Lacks Zod/Validation for complex match payloads.
- **Bot Logic**: [matchEngine.ts:380](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/matchEngine.ts#L380) (`getBotAction`). Primitive priority list; doesn't react to opponent health levels properly.

## 5. Logic & Data Flow Inconsistencies

- **The "Uno" Gap**: [matchEngine.ts:321](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/matchEngine.ts#L321). Game is "Play up to 3 cards". Uno is "Play 1 card that matches". Fundamental pivot required.
- **Card Catalog Efficiency**: [cardCatalog.ts:60](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/cardCatalog.ts#L60). Loads full JSON every time.
- **Local vs Cloud Messaging**: [lan/page.tsx](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/lan/page.tsx). Blurred distinction between "Local WiFi" and "Global" rooms.

## 6. Hardcoded Values

- **Theme Tokens**: [page.tsx:381](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/tabletop/[code]/page.tsx#L381) (`bg-[#0d131f]`). Many components have hardcoded colors ignoring the active theme.
- **Emoji List**: [gameConfig.ts:50](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/gameConfig.ts#L50). Hardcoded array, inflexible for expansion.

## 7. Dead Ends & Unreachable Paths

- **Leaderboard Clarity**: [leaderboard/page.tsx:11](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/app/leaderboard/page.tsx#L11). Displays "Victory Points" vs "Survival Points" without explanation.
- **Tutorial Flow**: [tutorialEngine.ts:92](file:///c:/Users/carte/OneDrive/Desktop/Code/Apps/FracturedEarth/src/lib/tutorialEngine.ts#L92). Many steps can be skipped via "ACK" too easily.

---

**Next Step**: Implementation of a unified design system and a game engine refactor to support the "Uno-like" flow with high-fidelity animations.
