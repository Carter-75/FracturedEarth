# Fractured Earth: Full Read-Only Audit Report

This report summarizes all bugs, broken behaviors, logic errors, and technical issues found during a comprehensive audit of the `FracturedEarth` repository and its live deployment at `https://fractured-earth.vercel.app/`.

---

## 🌐 API and Network

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/angular-mobile/src/app/services/game.service.ts:66` | **Endpoint Mismatch** | Mobile app calls `/api/match/[code]/action` but the server only implements `/api/rooms/[code]/action`. |
| `apps/next-api/app/layout.tsx:35` | **400 Bad Request** | Google AdSense (ca-pub-0000000000000000) fails with a 400 error due to invalid configuration. |
| `/api/tutorial/start` | **400 Bad Request** | Tutorial initialization fails on the live site, leaving the user stuck on the loading screen. |
| `/api/rooms/[code]/action` | **400 Bad Request** | Post-match actions (like ending a turn) fail on the live site, halting gameplay progression. |
| `apps/next-api/lib/matchService.ts:82` | **Latency Sensitivity** | Heartbeat check is set to 5 seconds, which is too aggressive compared to the 60s grace period in `rooms.ts`. |

---

## 🎮 Game Logic

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/next-api/lib/matchEngine.ts` | **Multiplayer Desync** | Extensive use of `Math.random()` in `resolveEffect` without shared seeds will cause state divergence between players. |
| `apps/next-api/lib/matchEngine.ts:555` | **Logic Placeholder** | `UNDO_LAST_TURN` is a non-functional proxy that merely heals the player instead of reverting state. |
| `apps/next-api/lib/matchEngine.ts:988` | **Blocked Progression** | Mandatory draw rule prevents turn completion, but the live site deck interaction fails to register the draw. |
| `apps/next-api/lib/matchEngine.ts:811` | **Bot Stall** | If a bot action fails server-side, the state remains in "THINKING" indefinitely with no fallback. |
| `apps/next-api/lib/matchEngine.ts:66` | **State desync** | `isNewDraw` calculation in `TabletopScene` relies on a potentially stale `this.gameState` comparison. |

---

## 🖌️ Rendering

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/next-api/phaser/scenes/TabletopScene.ts:262` | **Opponent Overlap** | All opponent avatars are rendered at the same `startX` (`width/2`), causing them to stack on top of each other. |
| `apps/next-api/app/tutorial/page.tsx:303` | **Engine Inconsistency** | The tutorial uses a completely separate DOM-based 3D simulation instead of the Phaser engine used in the main game. |
| `apps/next-api/phaser/scenes/PreloadScene.ts:37` | **Asset Timeout** | A hardcoded 5-second timeout forces scene transitions even if assets (like type-bgs) fail to load. |
| `apps/next-api/components/PhaserGame.tsx:30` | **Race Condition** | Initialization data is set in the registry after `createGame`, which can lead to scenes booting before the registry is populated. |

---

## ✨ Card Effects and Routing

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/next-api/lib/cardCatalog.ts:22` | **Schema Mismatch** | Field mapping from JSON `description` to `effect` is inconsistent and potentially redundant across the codebase. |
| `apps/next-api/lib/matchEngine.ts:345` | **Truncation Risk** | Logic in `DRAW_CARDS` sets `isTruncated = true` on Twists, potentially skipping subsequent card draws and logic. |
| `apps/next-api/lib/matchEngine.ts:220` | **State Reference** | `REPEAT_LAST_SURVIVAL` logic in `resolveEffect` might incorrectly reference `state.turnHistory` instead of the current state. |

---

## 📱 UI and Layout

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/next-api/app/tabletop/page.tsx:153` | **Visual Overlap** | The "YOUR TURN" banner overlaps the card focus view, obscuring critical textual information. |
| `apps/next-api/app/lobby/[code]/page.tsx` | **Input Truncation** | Sector Frequency input field truncates to 6 characters without notification, causing invalid sync attempts. |
| `apps/next-api/app/page.tsx` | **Discoverability** | Navigation buttons like "Settings" and "NeuralAtlas" are positioned below the fold with no scroll indicators. |
| `apps/next-api/app/page.tsx` | **Broken Action** | The "Sign_In" button lacks an assigned event listener or functional route, rendering it useless. |
| `apps/next-api/components/SectorPassPopup.tsx` | **Store Lockout** | High-value monetization (Store) is entirely disabled on Web, essentially blocking revenue from that platform. |

---

## 🛠️ Other Issues

| Reference | Error/Failure | Description |
|-----------|---------------|-------------|
| `apps/next-api/globals.css` | **Interactivity Delay** | UI elements frequently require a "wiggle" (hover/scroll) before becoming interactive due to `pointer-events` or React hydration lag. |
| `console` | **Security Warnings** | Multiple `SecurityError` warnings occur due to cross-origin iframe access attempts by broken ad scripts. |
| `apps/next-api/package.json` | **Version Outdated** | Monorepo dependencies are becoming fragmented (e.g., Capacitor versions) between `angular-mobile` and `next-api`. |

---

### Audit Summary
The **Fractured Earth** project is visually impressive but suffers from a critical disconnect between the mobile and web API layers. The move to **Phaser** for rendering is a significant performance improvement, but logic-heavy components (Tutorial, Bot Turns) remain brittle and susceptible to API failures and state desyncs. Immediate focus should be placed on correcting the endpoint mismatch and stabilizing the room synchronization logic.
