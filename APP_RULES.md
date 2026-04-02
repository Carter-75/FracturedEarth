# Mobile-First Monorepo Architecture & Rules

**Standard for: All future apps (e.g., GameX, AppY)**

This document defines the architectural patterns, database setup, and deployment strategy for mobile-first applications that work identically on web (Vercel) and Android (Capacitor).

This is the only documentation file to maintain for architecture + build/deploy rules. Do not split these rules into a separate architecture document.

---

## 1. Monorepo Structure

### Root Directory Layout
```
ProjectName/
├── apps/
│   ├── mobile-client/             # 📱 Frontend: Angular/Next-Mobile + Capacitor
│   │   ├── src/app/               # UI Components & App Router
│   │   ├── android/               # Native Android wrapper (Capacitor)
│   │   │   ├── app/build.gradle   # Target SDK 35 (Latest), com.yourcompany.myapp
│   │   │   └── variables.gradle   # Centralized SDK version management
│   │   ├── capacitor.config.ts    # Bridge configuration
│   │   └── ...
│   ├── api-backend/               # 🌐 Backend: Next.js API & Node
│   │   ├── src/app/api/           # API Endpoints (Universal)
│   │   ├── scripts/               # Migration and maintenance scripts
│   │   └── ...
├── build/                         # 🎯 Centralized Artifacts (APK/AAB)
│   └── backup/                    # Automatically archived old builds
├── build-and-deploy.ps1           # 👈 Unified build script template (Required)
├── APP_RULES.md                   # 👈 Design guidelines & architecture rules
└── PROJECT_TODO.md                # 👈 Active task tracking
```

**All game logic lives in the backend lib** (`apps/api-backend/src/lib/`) — shared business logic for:
- Game rules & state machine
- Tutorial workflow
- Room management
- Multiplayer synchronization
- User profiles & data

**API routes export this logic** (`apps/api-backend/src/app/api/`) — both web and mobile call the same endpoints.

---

## 2. Platform Architecture

### Web & API Platform (Next.js/Node on Vercel)
1. **Built from**: `apps/api-backend`
2. **Deployment**: GitHub push → Vercel auto-deploys API.
3. **Database**: MongoDB/Mongoose (Standard Persistence Layer).
4. **Logic**: API routes handle shared state and server-side resolution.

### Mobile Platform (Frontend + Capacitor)
1. **Built from**: `apps/mobile-client`
2. **Framework**: Angular or Next.js (Static Export) + Capacitor.
3. **Android Build**: Capacitor → Gradle → Target SDK 35 (Minimum Requirement).
4. **Identifier**: `com.yourcompany.myapp` (Provisioned Package Name).
5. **Flow**: Client UI → HTTPS Calls to `/api/*` → Backend Controller.

---

## 3. Database Setup (MongoDB Atlas)

### Why MongoDB?
- Flexible document schema for complex card effects.
- Unified storage for global card data, user profiles, and active match states.
- High performance for real-time polling across web and mobile.

### Implementation

#### A. Multi-Regional Scalability
Data is hosted on **MongoDB Atlas** (Global Cluster) and accessed via **Mongoose** in `apps/api-backend`.

#### B. Data Migration Service
All apps should include a JSON-to-Db migration script in `apps/api-backend/scripts/migrate-data.ts`.

To refresh the database from local JSON data:
```bash
cd apps/api-backend
npx tsx scripts/migrate-data.ts
```

#### C. Concurrency Control
Revision numbers are mandatory for optimistic concurrency to prevent race conditions during simultaneous client updates.

---

## 4. Game Logic Structure (`apps/api-backend/src/lib/`)

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

**Mobile Client** (`apps/mobile-client/src/app/services/game.service.ts`):
```typescript
// Heartbeat / State Polling
setInterval(async () => {
  const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/state`);
  const data = await res.json();
  this.gameState$.next(data.state);
}, 1000); // Poll every 1 second
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

## 6. Build & Deployment (Unified Automation)

### Build Script (`build-and-deploy.ps1`)
The root directory contains a unified PowerShell script that orchestrates the entire build pipeline for both Next-API and Angular-Mobile.

#### Key Features:
1. **Environment Sync**: Automatically updates Vercel environment variables (e.g., `MONGODB_URI`).
2. **Database Migration**: Optional switch (`-SkipMigration`) to run or skip card data migrations.
3. **Artifact Management**:
   - Moves generated APK and AAB files to the root `build/` directory.
   - **Backup System**: Automatically moves existing artifacts in `build/` to `build/backup/` with a timestamp before replacing them.
4. **Build Control**:
   - `-SkipBuild`: Allows running only the artifact movement and environment sync logic (useful if the build was already completed manually).
   - `-SkipVercel`: Skips Vercel configuration steps.

### Deployment Workflow
1. **Web (API)**: Automatic deployment via GitHub → Vercel integration.
2. **Android**:
   - Run `./build-and-deploy.ps1`.
   - Retrieve the production-ready `.aab` from the `build/` folder.
   - Manually upload to Google Play Console.

### Release Requirements (Android)
- **Package Name**: Must be `com.fracturedearth`.
- **Target SDK**: Level 35 (Android 15).
- **Optimization**: `minifyEnabled true` and `ndk { debugSymbolLevel "FULL" }` are mandatory for production releases to ensure deobfuscation and crash analysis.

---

## 7. Android Configuration

### `apps/mobile-client/android/variables.gradle`
This file centralizes all SDK and library versions for the native Android wrapper:
```gradle
ext {
    minSdkVersion = 24
    compileSdkVersion = 35
    targetSdkVersion = 35
    // ...
}
```

### `apps/mobile-client/android/app/build.gradle`
Standard production settings:
```gradle
android {
    namespace "com.yourcompany.myapp"
    defaultConfig {
        applicationId "com.yourcompany.myapp"
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            ndk {
                debugSymbolLevel "FULL"
            }
        }
    }
}
```

### API Base URL
**Production**: `https://fractured-earth.vercel.app/api`
**Local**: `http://localhost:3000/api`

---

### Apps Setup (Web & Mobile)
```bash
# Backend/API (Next.js)
cd apps/next-api
npm install
npm run dev # http://localhost:3000

# Frontend (Angular/Capacitor)
cd apps/angular-mobile
npm install
npm run start # http://localhost:4200
```

### Android Development
```bash
# Sync web changes to Android
cd apps/angular-mobile
npx cap sync android

# Run via Android Studio or command line
cd android
./gradlew :app:assembleDebug
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
3. **Use shared types from backend lib** — TypeScript contracts.
4. **Store all multiplayer state in the Database** — single source of truth.
5. **Implement heartbeats for connection tracking** — detect disconnects.
6. **Use revision numbers for optimistic concurrency** — prevent race conditions.
7. **Validate all input** — sanitize userId, roomCode, etc. in API routes.
8. **Test game logic independently** — pure functions are testable.
9. **Use environment variables for secrets** — MongoDB URIs, API keys, etc.

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

#### Step 1: Define types (`apps/api-backend/src/lib/types.ts`)
```typescript
export type CardType = 'BASIC' | 'POWER_UP' | 'DISASTER';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  effect: () => void;
}
```

#### Step 2: Add to game logic (`apps/api-backend/src/lib/gameEngine.ts`)
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

**Mobile/Web UI** (`apps/mobile-client/src/app/components/card.component.ts`):
```typescript
@Component({
  selector: 'app-card',
  template: `
    <div [class.bg-gold]="card.type === 'POWER_UP'">
      {{card.name}}
    </div>
  `
})
export class CardComponent {
  @Input() card!: Card;
}
```

**Both platforms now support power-ups, single logic source.**

---

## 11. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Client can't reach API | API URL wrong or Vercel not deployed | Check `API_BASE_URL` in environment, ensure Vercel deployment is live |
| Game state out of sync | Polling too slow or revision mismatch | Increase polling frequency, check revision logic in Match controller |
| Database not persisting | MongoDB Atlas not configured | Set `MONGODB_URI` in Vercel env vars |
| Type errors on mobile | TypeScript not synced | Ensure frontend types match `apps/api-backend/src/lib/types.ts` |

---

## 12. Checklist for Project Maintenance

- [ ] Execute `./build-and-deploy.ps1` for production-ready AAB.
- [ ] Verify `build/` contains the latest APK/AAB and `build/backup/` has the previous iteration.
- [ ] Ensure `applicationId` matches your registry in `build.gradle` and `capacitor.config.ts`.
- [ ] Ensure `targetSdkVersion` is set to the current Play Store minimum (35+).
- [ ] Confirm R8 minification is enabled (`minifyEnabled true`).
- [ ] Verify `NDK` debug symbols are generated (`FULL`).
- [ ] Upload the AAB and ensure all privacy permissions (e.g., `AD_ID`) are declared in manifest.

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

### Template: TypeScript API Service
```typescript
@Injectable({ providedIn: 'root' })
export class GameService {
  private http = inject(HttpClient);
  
  async callGameAction(action: GameAction): Promise<GameState> {
    const url = `${API_BASE_URL}/game/action`;
    return firstValueFrom(this.http.post<GameState>(url, action));
  }
}
```

---

**For every new app:**

1. **Single Monorepo** → Both platforms share a unified backend service.
2. **Game logic in Backend Lib** → Pure functions, shared via API.
3. **Universal API Routes** → `/api/*` endpoints serve all clients.
4. **Shared Database (MongoDB)** → Single source of truth.
5. **Vercel for API Deployment** → GitHub push goes live automatically.
6. **Mobile Artifact Pipeline** → Automatic backup and localized build folder.

**Result**: One logic source, multi-platform execution, zero duplication.

