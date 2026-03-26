# FracturedEarth - Unified Mobile-First Monorepo

## Architecture Overview

FracturedEarth now uses a **unified monorepo structure** where:
- **Web (Vercel)** and **Android (Kotlin)** share the same game logic
- All TypeScript/JavaScript logic lives in `src/lib/`
- Both platforms consume the same API endpoints
- Single package.json at root for build orchestration

```
FracturedEarth/
├── src/                      # 🎯 Unified Next.js application
│   ├── app/                  # Next.js App Router (routes + API)
│   │   ├── game/            # Game dashboard
│   │   ├── tutorial/        # Tutorial page
│   │   ├── settings/        # Settings page
│   │   ├── rules/           # Rules reference
│   │   ├── api/             # ⭐ API ENDPOINTS
│   │   │   ├── rooms/       # Room management: /api/rooms, /api/rooms/[code]/*
│   │   │   ├── tutorial/    # Tutorial endpoints: /api/tutorial/start, /api/tutorial/action
│   │   │   └── auth/        # Authentication
│   │   └── layout.tsx       # Global layout
│   ├── lib/                 # ⭐ SHARED GAME LOGIC
│   │   ├── matchEngine.ts   # Game state machine + rules
│   │   ├── tutorialEngine.ts # Tutorial workflow
│   │   ├── rooms.ts         # Room state management
│   │   ├── localProfile.ts  # Client-side storage
│   │   ├── kv.ts            # Vercel KV store (Azure compat)
│   │   └── types.ts         # Game types
│   ├── components/          # React components
│   ├── types/               # TypeScript type definitions
│   ├── package.json         # Next.js dependencies
│   └── tsconfig.json        # Path aliases (@/lib, etc.)
├── android-app/             # 📱 Android native wrapper (Kotlin/Compose)
│   ├── app/                 # Android app module
│   ├── build.gradle.kts     # Android build config
│   └── src/main/kotlin/     # Kotlin code
├── package.json             # 🎯 Root config - run commands from here
└── README.md
```

## How It Works

### 1. **Shared Game Logic (API Endpoints)**
Game logic lives in `src/lib/`:
- `matchEngine.ts`: Card game rules, turn flow, card mechanics
- `tutorialEngine.ts`: Tutorial workflow with fixed cards/bot
- `rooms.ts`: Room state, player management
- `types.ts`: Shared TypeScript interfaces

These are exported as **API endpoints** in `src/app/api/`:
- `POST /api/tutorial/start` → calls `tutorialEngine.startTutorial()`
- `POST /api/tutorial/action` → calls `tutorialEngine.applyTutorialAction()`
- `POST /api/rooms/[code]/action` → calls `matchEngine.applyMatchAction()`
- etc.

### 2. **Web Platform (Next.js)**
- Served via Vercel
- Pages in `src/app/` render React UI
- Calls `/api/*` endpoints from `src/app/api/`
- Stores client state in `localStorage` via `localProfile.ts`

### 3. **Android Platform (Kotlin)**
- Native Android app (Compose UI)
- Makes HTTP requests to same `/api/*` endpoints
- Can run locally (http://localhost:3000) or against Vercel deployment
- Stores client state in Android SharedPreferences/Room Database

## Build & Deploy

### Web (Next.js → Vercel)
```bash
npm run build              # Full build from root
npm --prefix src run build # Build just src/
# Vercel auto-deploys on git push
```

### Android
```bash
npm run build              # First build Next.js (generates API)
./gradlew :android-app:assembleDebug  # Build Android APK
# Android app targets deployed web API or local dev server
```

### Root Commands
```bash
npm run dev         # Start local dev server (src/)
npm run build       # Production build (src/)
npm run lint        # Lint src/
npm run type-check  # Type check src/
npm run clean       # Clean build artifacts
npm run android:build # Prepare for Android build
```

## Key Benefits

✅ **Single Source of Truth**: Game logic in `src/lib/` used by both platforms  
✅ **No Code Duplication**: tutorialEngine.ts written once, consumed twice  
✅ **Fast Development**: Change game rule, both web & Android get update immediately  
✅ **Type Safety**: Shared TypeScript types for API contracts  
✅ **Scalable**: Both platforms grow together, same ruleset  
✅ **Easy Deployment**: Web → Vercel (auto), Android → Play Store (manual)  

## API Contract Example

**Tutorial Endpoint** (`src/app/api/tutorial/start/route.ts`):
```typescript
// Exported from src/lib/tutorialEngine.ts
export function startTutorial(input) {
  // Fixed cards, fixed bot, deterministic flow
  return { session, step }
}
```

Both web UI (`src/app/tutorial/page.tsx`) and Android (Kotlin) call:
```
POST /api/tutorial/start
Body: { userId, displayName, emoji }
Response: { session, step }
```

Same request/response, different UI renderers.

## File Examples

- **Web UI** (React): `src/app/tutorial/page.tsx` → calls `POST /api/tutorial/start`
- **Shared Logic** (TypeScript): `src/lib/tutorialEngine.ts` → exported by API route
- **Android UI** (Kotlin): `android-app/src/.../TutorialScreen.kt` → calls `POST /api/tutorial/start`

All three use the **exact same game logic**, just different UI layers.

## Next Steps

1. ✅ Monorepo structure unified
2. ✅ Web build passes
3. ✅ Android build passes  
4. 🚀 Deploy web to Vercel
5. 🚀 Android app targets deployed API URL
6. 🔄 Continuous development: Change src/lib → both platforms update

---

**Navigation**:
- Game Logic: [`src/lib/`](src/lib)
- Web Routes: [`src/app/`](src/app)
- API Endpoints: [`src/app/api/`](src/app/api)
- Android App: [`android-app/`](android-app)
