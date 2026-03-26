# Multiplayer Plan (KV + Local Wi-Fi)

## Direction
- Keep Vercel KV as backend coordination for multiplayer lobbies.
- Support 2-4 players.
- Support both:
  - cloud internet rooms
  - local Wi-Fi rooms (LAN discovery + direct/hosted session transport)

## Current foundation
- `MultiplayerRepository` stores lobby state in KV using:
  - `lobby:{code}:meta`
  - `lobby:{code}:members`
- Repository supports:
  - create lobby
  - join lobby
  - leave lobby
  - fetch lobby snapshot
  - start match
- Lobby constraints currently enforced:
  - max players clamped to 2..4
  - only host can start a match
  - only open lobbies can be joined

## Next implementation steps
1. Transport layer
- Add LAN discovery implementation (Android NSD) for `LOCAL_WIFI` mode.
- Add match state sync channel:
  - Option A: host-authoritative over WebSocket service
  - Option B: periodic KV polling fallback

2. Match protocol
- Define turn command envelope:
  - draw
  - playCard
  - endTurn
  - reaction/adapt
- Add deterministic seed per match and command ordering.

3. Security and validation
- Add signed host token for privileged operations (`startMatch`, `closeLobby`).
- Add per-lobby write throttling and stale-lobby cleanup.

4. UX screens
- Add Multiplayer Menu:
  - Create Room
  - Join Room (code)
  - LAN discovery list
- Add room lobby screen with readiness and host controls.

## Notes
- This is not pure offline mode. It is hybrid online/LAN multiplayer.
- Existing bot/offline mode remains available as a separate play option.
