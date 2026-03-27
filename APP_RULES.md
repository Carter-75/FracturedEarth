# Mobile-First Monorepo Architecture & Rules

**For: All future apps (e.g., GameX, AppY)**

This document defines the architectural patterns, database setup, and deployment strategy for mobile-first applications that work identically on web (Vercel) and Android.

This is the only documentation file to maintain for architecture + build/deploy rules. Do not split these rules into a separate architecture document.

---

## 1. Monorepo Structure

### Root Directory Layout
```
MyApp/
├── src/                           # ⭐ Unified Next.js application (web + Android UI)
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx              # Home page
│   │   ├── api/                  # ⭐ BACKEND API (both platforms call this)
│   │   │   ├── rooms/            # Room management
│   │   │   ├── tutorial/         # Game tutorial
│   │   │   ├── game/             # Game logic
│   │   │   └── auth/             # Authentication
│   │   ├── game/                 # Game page
│   │   ├── settings/             # Settings page
│   │   ├── layout.tsx            # Global layout
│   │   └── ...other-routes
│   ├── lib/                       # ⭐ SHARED GAME LOGIC (core rules/mechanics)
│   │   ├── gameEngine.ts         # Main game state machine & rules
│   │   ├── tutorialEngine.ts     # Tutorial/onboarding logic
│   │   ├── rooms.ts              # Room/lobby state management
│   │   ├── database.ts           # Database helpers (KV, users, etc)
│   │   ├── types.ts              # Shared TypeScript interfaces
│   │   ├── utils.ts              # Utility functions
│   │   └── constants.ts          # Game constants
│   ├── components/                # React UI components (web)
│   ├── types/                     # Additional TypeScript types
│   ├── public/                    # Static assets (images, icons)
│   ├── package.json              # Next.js dependencies
│   ├── tsconfig.json             # TypeScript config (paths: @/lib, etc)
│   ├── next.config.js            # Next.js config
│   ├── tailwind.config.ts        # Tailwind CSS config
│   └── vercel.json               # Vercel deployment config
├── android-app/                  # 📱 Android native wrapper (Kotlin/Compose)
│   ├── app/                      # Android app module
│   ├── build.gradle.kts          # Android build config
│   ├── capacitor.json            # Capacitor bridge config
│   └── src/main/kotlin/          # Kotlin source
├── package.json                  # 🎯 Root orchestration config
└── APP_RULES.md                  # 👈 Single source of truth for architecture + rules
```

### Key Principle
**All game logic lives in `src/lib/`** — shared business logic for:
- Game rules & state machine
- Tutorial workflow
- Room management
- Multiplayer synchronization
- User profiles & data

**API routes export this logic** (`src/app/api/`) — both web and Android call the same endpoints.

---

## 2. Platform Architecture

### Web Platform (Next.js on Vercel)
1. **Built from**: `src/` (Next.js)
2. **Deployment**: GitHub push → Vercel auto-deploys
3. **Client State**: React state + localStorage
4. **Server State**: Vercel KV (Redis)
5. **UI Rendering**: React components in browser
6. **Flow**: Browser → `/api/*` routes → `src/lib/*` logic → KV store

### Android Platform (Kotlin/Compose)
1. **Built from**: `android-app/` (Gradle)
2. **Deployment**: Manual build → Play Store (no auto-deploy)
3. **Client State**: Android Room database / SharedPreferences
4. **Server State**: Same Vercel KV (shared backend)
5. **UI Rendering**: Kotlin Compose UI in WebView or native
6. **Flow**: Kotlin UI → HTTP `http://vercel-app.vercel.app/api/*` → Vercel → `src/lib/*` → KV store

**Important**: Both platforms hit the **same backend API** and **same database**. No separate backend for Android.

---

## 3. Database Setup (Vercel KV / Redis)

### Why Vercel KV?
- Free tier sufficient for indie games
- Auto-scales
- Vercel integration (no extra config)
- Works with both web and Android talking to same store

### Implementation

#### A. Environment Variables
**`.env.local`** (not in git):
```bash
KV_URL=redis://default:...@....upstash.io:...
KV_REST_API_URL=https://....upstash.io
KV_REST_API_TOKEN=...
```

Go to [Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables → Add from Upstash Redis.

#### B. Database Helper (`src/lib/database.ts`)

```typescript
import { kv } from '@vercel/kv';

// User Profiles
export async function getUserProfile(userId: string) {
  return kv.hgetall(`user:${userId}`);
}

export async function setUserProfile(userId: string, data: any) {
  await kv.hset(`user:${userId}`, data);
  await kv.expire(`user:${userId}`, 31536000); // 1 year
}

// Game Rooms
export async function getRoom(roomCode: string) {
  return kv.hgetall(`room:${roomCode}`);
}

export async function setRoom(roomCode: string, data: any) {
  await kv.hset(`room:${roomCode}`, data);
  await kv.expire(`room:${roomCode}`, 86400); // 24 hours
}

// Game State (with revision for optimistic concurrency)
export async function getGameState(roomCode: string) {
  return kv.get(`game:${roomCode}`);
}

export async function setGameState(roomCode: string, state: any, expectedRevision: number) {
  const current = await kv.get(`game:${roomCode}`);
  if (current && current.revision !== expectedRevision) {
    throw new Error('Stale state (revision mismatch)');
  }
  await kv.set(`game:${roomCode}`, { ...state, revision: expectedRevision + 1 });
}
```

#### C. Usage in API Routes

**`src/app/api/rooms/create/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { setRoom, setUserProfile } from '@/lib/database';

export async function POST(req: NextRequest) {
  const { userId, roomCode, displayName } = await req.json();

  // Store room in KV
  await setRoom(roomCode, {
    hostUserId: userId,
    hostName: displayName,
    createdAt: Date.now(),
    members: [userId],
    status: 'OPEN',
  });

  // Update user profile
  await setUserProfile(userId, { lastRoomCode: roomCode });

  return NextResponse.json({ success: true, roomCode });
}
```

---

## 4. Game Logic Structure (`src/lib/`)

### Core Patterns

#### A. Game State Machine (`gameEngine.ts`)

```typescript
// Exported types/interfaces
export interface GameState {
  players: Player[];
  round: number;
  currentTurn: string; // userId
  cards: Card[];
  status: 'WAITING' | 'PLAYING' | 'COMPLETED';
}

export interface Action {
  type: 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN';
  actorUserId: string;
  payload: any;
}

// Pure function: current state + action → new state
export function applyGameAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'DRAW_CARD':
      return { ...state, cards: [...state.cards, drawCard()] };
    case 'PLAY_CARD':
      return { ...state, /* apply card effect */ };
    case 'END_TURN':
      return { ...state, currentTurn: nextPlayer(state) };
    default:
      return state;
  }
}

// Check win condition
export function detectWinner(state: GameState): string | null {
  // return userId if won, null otherwise
}
```

**Principle**: Game logic is **pure functions** (no side effects), testable everywhere.

#### B. Tutorial Logic (`tutorialEngine.ts`)

```typescript
export interface TutorialStep {
  step: number;
  title: string;
  description: string;
  expectedAction: 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN';
  fixedHand?: Card[];
  fixedOpponent?: Player;
}

export function startTutorial(): GameState {
  // Fixed setup: deterministic hand, bot opponent
}

export function applyTutorialAction(state: GameState, action: Action): GameState {
  // Validate action matches expectedAction
  // Apply via applyGameAction
}

export function getCurrentStep(stepIndex: number): TutorialStep | null {
  // Return step definition
}
```

#### C. Room Management (`rooms.ts`)

```typescript
export interface Room {
  code: string;
  hostUserId: string;
  members: { userId: string; displayName: string }[];
  currentGameState?: GameState;
  status: 'LOBBY' | 'PLAYING' | 'COMPLETED';
}

export async function createRoom(userId: string, displayName: string): Promise<string> {
  const code = generateCode(); // 6-char alphanumeric
  await setRoom(code, { hostUserId: userId, members: [{ userId, displayName }] });
  return code;
}

export async function joinRoom(code: string, userId: string, displayName: string): Promise<boolean> {
  const room = await getRoom(code);
  if (!room) return false;
  room.members.push({ userId, displayName });
  await setRoom(code, room);
  return true;
}

export async function syncGameState(code: string, state: GameState): Promise<void> {
  await setGameState(code, state, state.revision);
}
```

### API Routes Export Logic

**`src/app/api/game/action/route.ts`**:
```typescript
import { applyGameAction } from '@/lib/gameEngine';
import { getRoom, syncGameState } from '@/lib/rooms';

export async function POST(req: NextRequest) {
  const { roomCode, userId, action } = await req.json();

  const room = await getRoom(roomCode);
  const newState = applyGameAction(room.currentGameState, action);

  await syncGameState(roomCode, newState);

  return NextResponse.json({ success: true, state: newState });
}
```

---

## 5. Multiplayer & Real-Time

### Polling Pattern (Recommended for MVP)

**Web Client** (`src/app/game/page.tsx`):
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/rooms/${roomCode}/state`);
    const data = await res.json();
    setGameState(data.state);
  }, 1000); // Poll every 1 second
  return () => clearInterval(interval);
}, [roomCode]);
```

**Android Client** (Kotlin):
```kotlin
scope.launch(Dispatchers.IO) {
  while (isActive) {
    val response = httpClient.get("https://app.vercel.app/api/rooms/$roomCode/state")
    val state = Json.decodeFromString<GameState>(response.bodyAsText())
    withContext(Dispatchers.Main) {
      viewModel.setGameState(state)
    }
    delay(1000) // Poll every 1 second
  }
}
```

### Heartbeat Pattern (Connection Management)

**`src/app/api/rooms/[code]/heartbeat/route.ts`**:
```typescript
export async function POST(req: NextRequest, { params }) {
  const { userId } = await req.json();
  const room = await getRoom(params.code);
  
  // Mark player as active
  room.members = room.members.map(m => 
    m.userId === userId ? { ...m, lastHeartbeatMs: Date.now() } : m
  );
  
  await setRoom(params.code, room);
  return NextResponse.json({ success: true });
}
```

**Client-side** (both platforms):
```typescript
setInterval(() => {
  fetch(`/api/rooms/${roomCode}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}, 30000); // Every 30 seconds
```

---

## 6. Build & Deployment

### Web Deployment (Vercel)

**Step 1**: Connect GitHub to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your repo
- Set Environment Variables (KV_URL, KV_REST_API_TOKEN, etc.)
- Auto-deploy on push to `main`

**Step 2**: Build script
```bash
cd src && npm install && npm run build
```

**Step 3**: Serve
```bash
npm --prefix src run start
```

**Root Commands**:
```bash
npm run build       # Build Next.js
npm run dev         # Dev server (http://localhost:3000)
npm run lint        # Lint code
npm run type-check  # Type check
npm run android:artifacts         # Build debug APK + release APK + release AAB, then push (default)
npm run android:artifacts:no-push # Build debug APK + release APK + release AAB, skip push
npm run android:artifacts:push    # Build debug APK + release APK + release AAB, then push
```

### Required Android Artifact Script Pattern

Every app must include a debug-heavy artifact script in `scripts/web/build-and-deploy.ps1` and (optionally) `scripts/web/build-and-deploy.sh` that:

1. Runs clean + build tasks with verbose logging (`--stacktrace --info --debug --warning-mode all`)
2. Builds all release artifacts in one pass:
  - `:android-app:assembleDebug` (debug APK)
  - `:android-app:assembleRelease` (release APK)
  - `:android-app:bundleRelease` (release AAB)
3. Writes logs to `scripts/build-scripts/logs/`
4. Stages and commits changes
5. Supports explicit push control in a reusable workflow style:
  - **Default flow**: push to `origin/main`
  - **Optional local-safe flow**: skip push
  - PowerShell flags include `-Force` and `-SkipGit` (plus `-Push`)

Mandatory no-push switch:
- PowerShell: `-SkipGit` (preferred) or `-NoPush`
- Bash: `--skip-git` (preferred) or `--no-push`

Mandatory push switch:
- PowerShell: `-Push`
- Bash: `--push`

### Android Deployment

**Step 1**: Build web app first
```bash
npm run build
```

**Step 2**: Build Android
```bash
npm run android:artifacts         # Recommended default (push)
npm run android:artifacts:no-push # Use when you explicitly want local-only changes
```

**Step 3**: Sign and upload to Play Store (manual)

### Continuous Deployment

- **Web**: Automatic (GitHub → Vercel)
- **Android**: Requires manual Play Store upload (no auto-deploy)

---

## 7. Android Configuration

### `android-app/build.gradle.kts`

```gradle
android {
  compileSdk = 35
  defaultConfig {
    applicationId = "com.myapp.game"
    minSdk = 28
    targetSdk = 35
    versionCode = 1
    versionName = "1.0"
  }
}

dependencies {
  implementation("androidx.compose.ui:ui:1.5.0")
  implementation("com.squareup.okhttp3:okhttp:4.10.0")
  implementation("com.google.code.gson:gson:2.8.9")
}
```

### API Base URL

**Kotlin**:
```kotlin
const val API_BASE_URL = "https://myapp.vercel.app/api"

object ApiClient {
  val httpClient = OkHttpClient()
  
  suspend fun fetchGameState(roomCode: String): GameState {
    val url = "$API_BASE_URL/rooms/$roomCode/state"
    val response = httpClient.newCall(Request.Builder().url(url).build()).execute()
    return Json.decodeFromString(response.body!!.string())
  }
}
```

---

## 8. Local Development Setup

### Prerequisites
- Node.js 18+ (for web)
- Android Studio (for Android)
- Git

### Web Development

```bash
cd src
npm install
npm run dev
# Open http://localhost:3000
```

### Android Development

```bash
# Option 1: Emulator
./gradlew :android-app:assembleDebug
adb install android-app/build/outputs/apk/debug/app-debug.apk

# Option 2: Physical device (USB connected)
./gradlew :android-app:installDebug
```

### Testing API Endpoints Locally

```bash
# Start web dev server
npm run dev

# In another terminal, test endpoint
curl http://localhost:3000/api/rooms/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123", "displayName": "TestPlayer"}'
```

---

## 9. Key Rules & Constraints

### ✅ DO

1. **Keep game logic in `src/lib/`** — pure functions, no side effects
2. **Export logic via API routes** — both platforms call HTTP endpoints
3. **Use shared types from `src/lib/types.ts`** — TypeScript contracts
4. **Store all multiplayer state in KV** — single source of truth
5. **Implement heartbeats for connection tracking** — detect disconnects
6. **Use revision numbers for optimistic concurrency** — prevent race conditions
7. **Validate all input** — sanitize userId, roomCode, etc. in API routes
8. **Test game logic independently** — pure functions are testable
9. **Use environment variables for secrets** — KV URLs, API keys, etc.

### ❌ DON'T

1. **Don't put game logic in API routes** — logic should be in `src/lib/`
2. **Don't duplicate game code** — one tutorialEngine.ts, not two
3. **Don't hardcode API URLs** — use environment variables
4. **Don't trust client input** — validate on server
5. **Don't use Socket.IO for MVP** — polling is simpler, works on all platforms
6. **Don't store game state on client** — only sync from server
7. **Don't create separate Android backends** — both platforms use same API
8. **Don't commit secrets** — .env.local in .gitignore

---

## 10. Example: Building a New Game Feature

### Scenario: Add "Power-Up" card

#### Step 1: Define types (`src/lib/types.ts`)
```typescript
export type CardType = 'BASIC' | 'POWER_UP' | 'DISASTER';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  effect: () => void;
}
```

#### Step 2: Add to game logic (`src/lib/gameEngine.ts`)
```typescript
export function applyGameAction(state: GameState, action: Action): GameState {
  if (action.type === 'PLAY_CARD') {
    const card = findCard(state, action.cardId);
    if (card?.type === 'POWER_UP') {
      return applyPowerUpEffect(state, card);
    }
  }
  // ...
}

function applyPowerUpEffect(state: GameState, card: Card): GameState {
  // Logic for power-up effect
}
```

#### Step 3: Expose via API (`src/app/api/game/action/route.ts`)
```typescript
// Already calls applyGameAction, so power-up works automatically
```

#### Step 4: Render in UI

**Web** (`src/components/Card.tsx`):
```tsx
export function Card({ card }: { card: Card }) {
  return (
    <div className={card.type === 'POWER_UP' ? 'bg-gold' : 'bg-gray'}>
      {card.name}
    </div>
  );
}
```

**Android** (Kotlin):
```kotlin
@Composable
fun CardView(card: Card) {
  val bgColor = when(card.type) {
    CardType.POWER_UP -> Color.Yellow
    else -> Color.Gray
  }
  Box(modifier = Modifier.background(bgColor)) {
    Text(card.name)
  }
}
```

**Both platforms now support power-ups, single logic source.**

---

## 11. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Android can't reach API | API URL wrong or Vercel not deployed | Check `API_BASE_URL` in Kotlin, ensure Vercel deployment is live |
| Game state out of sync | Polling too slow or revision mismatch | Increase polling frequency, check revision logic in `setGameState` |
| Room not persisting | KV not configured | Set KV_URL and KV_REST_API_TOKEN in Vercel env vars |
| Duplicate game logic | Code was copied | Delete Android-specific logic, use HTTP calls instead |
| Type errors on Android | TypeScript not synced | Ensure Kotlin types match `src/lib/types.ts` |

---

## 12. Checklist for New App

- [ ] Create `src/` with Next.js structure
- [ ] Create `src/lib/gameEngine.ts` with core logic
- [ ] Create `src/app/api/game/action/route.ts` to expose logic
- [ ] Create `android-app/` with Gradle setup
- [ ] Add `src/lib/database.ts` with KV helpers
- [ ] Set KV_URL and KV_REST_API_TOKEN in Vercel env
- [ ] Implement heartbeat in both platforms
- [ ] Implement polling in both platforms
- [ ] Test web locally (`npm run dev`)
- [ ] Test Android locally (emulator or USB)
- [ ] Deploy web to Vercel
- [ ] Build Android APK
- [ ] Verify both platforms hit same endpoints

---

## 13. File Templates

### Template: API Route (`src/app/api/myfeature/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { myLogicFunction } from '@/lib/gameEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await myLogicFunction(body);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
```

### Template: Kotlin API Call
```kotlin
class GameRepository(val context: Context) {
  private val httpClient = OkHttpClient()
  
  suspend fun callGameAction(action: GameAction): GameState = withContext(Dispatchers.IO) {
    val url = "${API_BASE_URL}/game/action"
    val body = RequestBody.create(
      "application/json".toMediaType(),
      Json.encodeToString(action)
    )
    val request = Request.Builder().url(url).post(body).build()
    val response = httpClient.newCall(request).execute()
    Json.decodeFromString(response.body!!.string())
  }
}
```

---

## Summary

**For every new app:**

1. **Single `src/` monorepo** → both web and Android
2. **Game logic in `src/lib/`** → pure functions, shared
3. **API routes export logic** → `/api/*` endpoints
4. **Both platforms call same API** → no duplication
5. **KV for persistence** → single database
6. **Vercel for web auto-deploy** → GitHub push goes live
7. **Android manual build** → local testing, then Play Store

**Result**: One codebase, two platforms, zero duplication, easy maintenance.

