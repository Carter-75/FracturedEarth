# Fractured Earth

Fractured Earth now runs on a pure-MEAN product path:

- `apps/angular-app`
  Angular standalone frontend for web and Capacitor.
- `apps/api-server`
  Express + Socket.IO realtime backend.
- `packages/game-core`
  Shared rules engine, card helpers, and bot logic.

The older `apps/next-api` and `apps/angular-mobile` directories are still in the repository as migration source material, but they are not part of the active workspace build.

## Runtime Modes

- `Practice`
  Signed guest or signed logged-in session, server-authoritative bot match.
- `Live`
  Logged-in only public matchmaking queue.
- `Private Rooms`
  Logged-in only keyed rooms with optional bots.

The server is authoritative for draw/play/discard/end-turn flow, slot placement `0-3`, match resolution, reconnects, and bot advancement.

## Workspace Commands

- `npm run dev:api`
  Start the Express API server.
- `npm run dev:web`
  Start the Angular frontend.
- `npm run build`
  Build the shared core, API server, and Angular app.
- `npm run test`
  Run shared game-core tests.

## Environment

Copy `.env.example` to `.env` and set:

- `NODE_ENV`
- `PORT`
- `CLIENT_ORIGIN`
- `JWT_SECRET`
- `MONGODB_URI`
- `GOOGLE_CLIENT_ID`
- `CLEANUP_INTERVAL_MS`
- `FINISHED_MATCH_TTL_MS`
- `STALE_MATCH_TTL_MS`

Production mode requires a non-default `JWT_SECRET`, a valid `MONGODB_URI`, and a valid `GOOGLE_CLIENT_ID`. In development the API can fall back to in-memory persistence if Mongo is unavailable. In production it fails fast instead.

## Health And Operations

- `GET /health`
  Liveness plus current persistence mode.
- `GET /readyz`
  Readiness endpoint that reflects startup completion, shutdown state, and Mongo availability in production.

The API also:

- reloads persisted rooms and active matches from Mongo on startup
- prunes stale finished matches and orphaned rooms on an interval
- enforces signed realtime actors for reconnects and actions
- applies lightweight HTTP and socket rate limiting
- uses Google sign-in as the primary login/signup path for live and private play

## Deploy Notes

- `vercel.json` builds the Angular frontend only.
- The realtime API server is intended to run as a persistent Node service, not a serverless polling backend.
- The repo is now workspace-scoped to `apps/angular-app`, `apps/api-server`, and `packages/*`.

## Remaining Pre-Launch Work

- full browser QA for match flows
- Capacitor/native build verification
- exhaustive card-effect and interruption-chain testing
- stronger external auth if you want third-party identity providers
- metrics, tracing, and multi-instance realtime scaling if needed
