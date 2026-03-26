# Vercel Auto Deploy and Shared Backend Setup

This repo is configured so Vercel builds the web app and API routes automatically from git push.

## What this gives you
- Website deployment on Vercel.
- Backend API deployment on Vercel Serverless/Edge runtime through Next.js route handlers.
- Shared room/match APIs used by both web and Android clients.

## One-time Vercel project setup
1. Import this repository in Vercel.
2. Set Root Directory to `web` (recommended for monorepo layout).
3. Ensure Production Branch is `main`.
4. Add environment variables in Vercel Project Settings:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (production site URL)

## Android cross-platform sync target
- Point Android `LAN_ROOM_SERVER_URL` to your deployed Vercel URL for shared room APIs.
- Android uses these endpoints:
  - `/api/rooms`
  - `/api/rooms/[code]/join`
  - `/api/rooms/[code]/start`
  - `/api/rooms/[code]/state`
  - `/api/rooms/[code]/action`

## Single gameplay source of truth
- Match action processing now runs in `web/lib/matchEngine.ts`.
- Web and Android should call `/api/rooms/[code]/action` so gameplay action rules are centralized on the backend.

## After setup
- Every push to `main` triggers a production deployment automatically.
- Preview deployments are created automatically for pull requests.
