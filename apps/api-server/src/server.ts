import cors from 'cors';
import express from 'express';
import http from 'http';
import type { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { config, isProduction } from './config.js';
import { issueGuestSession, loginWithGoogleIdToken, registerOrLogin, verifyToken, type AuthenticatedUser } from './auth.js';
import { connectToDatabase, isDatabaseConnected } from './db.js';
import { consumeRateLimit, getClientKey, getSocketKey } from './rate-limit.js';
import {
  addBotToRoom,
  applyRealtimeAction,
  createPracticeMatch,
  createPrivateRoom,
  getCatalogCards,
  dequeuePlayer,
  enqueuePlayer,
  getBootstrap,
  getMatch,
  getQueueState,
  getRoom,
  joinPrivateRoom,
  loadPersistedState,
  maybeStartPublicMatch,
  pruneExpiredState,
  startRoomMatch,
} from './match-manager.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.clientOrigin,
    credentials: true,
  },
});

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());

let startupComplete = false;
let shuttingDown = false;
let cleanupTimer: NodeJS.Timeout | undefined;

app.use((req, res, next) => {
  const startedAt = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const scope = req.path.startsWith('/auth') || req.path.startsWith('/guest')
    ? 'auth'
    : req.path.startsWith('/match') || req.path.startsWith('/rooms')
      ? 'game'
      : 'general';
  const policy =
    scope === 'auth'
      ? { limit: 20, windowMs: 60_000 }
      : scope === 'game'
        ? { limit: 120, windowMs: 60_000 }
        : { limit: 240, windowMs: 60_000 };
  const result = consumeRateLimit(getClientKey(ip, scope), policy.limit, policy.windowMs);
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(result.resetAt));
  if (!result.allowed) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  res.on('finish', () => {
    if (req.path === '/health' || req.path === '/readyz') return;
    console.log(
      `[http] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms ${scope} ${ip}`
    );
  });
  next();
});

function assertProductionConfig() {
  if (!isProduction) return;
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is required in production');
  }
  if (!config.jwtSecret || config.jwtSecret === 'fractured-earth-dev-secret') {
    throw new Error('JWT_SECRET must be set to a non-default value in production');
  }
  if (!config.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is required in production');
  }
}

function getBearerToken(value?: string | null) {
  if (!value) return undefined;
  return value.replace(/^Bearer\s+/i, '');
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req.headers.authorization);
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as any).user = user;
  next();
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mode: config.nodeEnv,
    persistence: isDatabaseConnected() ? 'mongo' : 'memory',
    startupComplete,
    shuttingDown,
  });
});

app.get('/readyz', (_req, res) => {
  const persistence = isDatabaseConnected() ? 'mongo' : 'memory';
  const ready = startupComplete && !shuttingDown && (!isProduction || persistence === 'mongo');
  res.status(ready ? 200 : 503).json({
    ok: ready,
    mode: config.nodeEnv,
    persistence,
    startupComplete,
    shuttingDown,
  });
});

app.post('/auth/login', async (req, res) => {
  if (isProduction) {
    res.status(403).json({ error: 'Email login is disabled in production. Use Google sign-in.' });
    return;
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  const displayName = String(req.body?.displayName || '').trim() || 'Commander';
  const emoji = String(req.body?.emoji || '🌍').trim() || '🌍';
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const session = await registerOrLogin(email, displayName, emoji);
  res.json(session);
});

app.post('/auth/google', async (req, res) => {
  try {
    const credential = String(req.body?.credential || '').trim();
    const emoji = String(req.body?.emoji || '🌍').trim() || '🌍';
    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    const session = await loginWithGoogleIdToken(credential, emoji);
    res.json(session);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Google authentication failed' });
  }
});

app.post('/guest/session', (req, res) => {
  const displayName = String(req.body?.displayName || 'Guest Commander').trim();
  const emoji = String(req.body?.emoji || '🌍').trim();
  res.json(issueGuestSession(displayName, emoji));
});

app.get('/config/bootstrap', (_req, res) => {
  res.json(getBootstrap());
});

app.get('/catalog/cards', (_req, res) => {
  res.json({ cards: getCatalogCards() });
});

app.post('/match/practice', async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  const sessionUser = verifyToken(token);
  if (!sessionUser) {
    res.status(401).json({ error: 'Signed session required' });
    return;
  }
  const player = {
    userId: sessionUser.userId,
    displayName: sessionUser.displayName,
    emoji: sessionUser.emoji || '🌍',
  };
  const snapshot = await createPracticeMatch(player);
  res.json(snapshot);
});

app.post('/rooms/private', requireAuth, async (req, res) => {
  const user = (req as any).user as AuthenticatedUser;
  const room = await createPrivateRoom({
    userId: user.userId,
    displayName: user.displayName,
    emoji: String(req.body?.emoji || '🌍'),
  });
  res.json(room);
});

app.get('/me', requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

app.patch('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      ...(req as any).user,
      displayName: req.body?.displayName || (req as any).user.displayName,
      emoji: req.body?.emoji || (req as any).user.emoji || '🌍',
    },
  });
});

io.use((socket, next) => {
  const token = getBearerToken(socket.handshake.auth.token || socket.handshake.headers.authorization);
  const user = verifyToken(token);
  (socket.data as any).user = user;
  next();
});

function requireRealtimeUser(socket: any): AuthenticatedUser | null {
  return ((socket.data as any).user as AuthenticatedUser | null) || null;
}

function requireSignedActor(socket: any, actorUserId: string, allowGuest: boolean) {
  const user = requireRealtimeUser(socket);
  if (!user) {
    throw new Error('Signed session required');
  }
  if (!allowGuest && user.isGuest) {
    throw new Error('Login required');
  }
  if (user.userId !== actorUserId) {
    throw new Error('Actor mismatch');
  }
  return user;
}

io.on('connection', (socket) => {
  socket.emit('presence:state', { connected: true, queue: getQueueState() });

  socket.on('presence:ping', () => {
    socket.emit('presence:state', { connected: true, timestamp: Date.now() });
  });

  socket.on('queue:join', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'queue'),
      30,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many queue requests' });
      return;
    }
    const user = requireRealtimeUser(socket);
    if (!user || user.isGuest) {
      socket.emit('match:error', { message: 'Login required for live queue' });
      return;
    }

    const queueState = enqueuePlayer({
      userId: user.userId,
      displayName: user.displayName,
      emoji: String(payload?.emoji || '🌍'),
    });
    io.emit('queue:update', queueState);

    const match = await maybeStartPublicMatch();
    if (match) {
      match.payload.players.forEach((player) => {
        const target = Array.from(io.sockets.sockets.values()).find(
          (candidate) => (candidate.data as any).user?.userId === player.id
        );
        if (target) {
          target.join(match.matchId);
          target.emit('match:snapshot', match);
        }
      });
      io.emit('queue:update', getQueueState());
    }
  });

  socket.on('queue:leave', () => {
    const user = (socket.data as any).user as AuthenticatedUser | null;
    if (!user) return;
    io.emit('queue:update', dequeuePlayer(user.userId));
  });

  socket.on('room:create', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'room-create'),
      10,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many room requests' });
      return;
    }
    const user = requireRealtimeUser(socket);
    if (!user || user.isGuest) {
      socket.emit('match:error', { message: 'Login required for private rooms' });
      return;
    }
    const room = await createPrivateRoom({
      userId: user.userId,
      displayName: user.displayName,
      emoji: String(payload?.emoji || '🌍'),
    });
    socket.join(room.code);
    socket.emit('room:update', room);
  });

  socket.on('room:join', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'room-join'),
      30,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many room requests' });
      return;
    }
    const user = requireRealtimeUser(socket);
    if (!user || user.isGuest) {
      socket.emit('match:error', { message: 'Login required for private rooms' });
      return;
    }

    const room = await joinPrivateRoom(String(payload?.code || '').toUpperCase(), {
      userId: user.userId,
      displayName: user.displayName,
      emoji: String(payload?.emoji || '🌍'),
    });

    if (!room) {
      socket.emit('match:error', { message: 'Room unavailable' });
      return;
    }

    socket.join(room.code);
    io.to(room.code).emit('room:update', room);
  });

  socket.on('room:addBot', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'room-bot'),
      20,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many room requests' });
      return;
    }
    const user = requireRealtimeUser(socket);
    const code = String(payload?.code || '').toUpperCase();
    const existingRoom = await getRoom(code);
    if (!user || user.isGuest || !existingRoom?.members.some((member) => member.userId === user.userId)) {
      socket.emit('match:error', { message: 'Room membership required to add bots' });
      return;
    }

    const room = await addBotToRoom(code);
    if (!room) {
      socket.emit('match:error', { message: 'Unable to add bot' });
      return;
    }
    io.to(room.code).emit('room:update', room);
  });

  socket.on('room:start', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'room-start'),
      10,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many room requests' });
      return;
    }
    const user = requireRealtimeUser(socket);
    const code = String(payload?.code || '').toUpperCase();
    const existingRoom = await getRoom(code);
    if (!user || user.isGuest || !existingRoom || existingRoom.ownerUserId !== user.userId) {
      socket.emit('match:error', { message: 'Only the room owner can start this room' });
      return;
    }

    const match = await startRoomMatch(code);
    if (!match) {
      socket.emit('match:error', { message: 'Unable to start room' });
      return;
    }
    const roomSockets = await io.in(code).fetchSockets();
    await Promise.all(roomSockets.map((roomSocket) => roomSocket.join(match.matchId)));
    io.to(match.payload.roomCode).emit('match:snapshot', match);
  });

  socket.on('match:reconnect', async (payload) => {
    const realtimeRate = consumeRateLimit(
      getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'match-reconnect'),
      30,
      60_000
    );
    if (!realtimeRate.allowed) {
      socket.emit('match:error', { message: 'Too many reconnect requests' });
      return;
    }
    const match = await getMatch(String(payload?.matchId || ''));
    if (!match) {
      socket.emit('match:error', { message: 'Match not found' });
      return;
    }
    const actorUserId = String(payload?.actorUserId || '');
    try {
      requireSignedActor(socket, actorUserId, match.mode === 'practice');
    } catch (error: any) {
      socket.emit('match:error', { message: error.message || 'Signed session required' });
      return;
    }
    const isParticipant = match.payload.players.some((player) => player.id === actorUserId);
    if (!isParticipant) {
      socket.emit('match:error', { message: 'Match participant required' });
      return;
    }
    socket.join(match.matchId);
    socket.emit('match:snapshot', match);
  });

  socket.on('match:action', async (payload) => {
    try {
      const realtimeRate = consumeRateLimit(
        getSocketKey(requireRealtimeUser(socket)?.userId, socket.id, 'match-action'),
        90,
        60_000
      );
      if (!realtimeRate.allowed) {
        throw new Error('Too many match actions');
      }
      const matchId = String(payload?.matchId || '');
      const match = await getMatch(matchId);
      if (!match) {
        throw new Error('Match not found');
      }
      const actorUserId = String(payload?.actorUserId || '');
      requireSignedActor(socket, actorUserId, match.mode === 'practice');
      const snapshot = await applyRealtimeAction(matchId, actorUserId, payload?.action);
      io.to(String(payload?.matchId || '')).emit('match:snapshot', snapshot);
      io.to(String(payload?.matchId || '')).emit('match:event', {
        revision: snapshot.revision,
        actorUserId,
        action: payload?.action,
      });
      if (snapshot.payload.winnerId) {
        io.to(String(payload?.matchId || '')).emit('match:complete', snapshot);
      }
    } catch (error: any) {
      socket.emit('match:error', { message: error.message || 'Action failed' });
    }
  });

  socket.on('disconnect', () => {
    const user = requireRealtimeUser(socket);
    if (!user) return;
    io.emit('queue:update', dequeuePlayer(user.userId));
  });
});

async function runCleanupCycle() {
  const result = await pruneExpiredState();
  if (result.prunedMatches > 0 || result.prunedRooms > 0) {
    console.log(`[cleanup] pruned ${result.prunedMatches} matches and ${result.prunedRooms} rooms`);
  }
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[api-server] received ${signal}, shutting down`);
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }
  io.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.exit(0);
}

async function start() {
  assertProductionConfig();
  await connectToDatabase();
  await loadPersistedState();
  cleanupTimer = setInterval(() => {
    runCleanupCycle().catch((error) => {
      console.error('[cleanup] failed', error);
    });
  }, config.cleanupIntervalMs);
  cleanupTimer.unref?.();
  server.listen(config.port, () => {
    startupComplete = true;
    const address = server.address() as AddressInfo | null;
    const port = address?.port || config.port;
    console.log(`[api-server] listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('[api-server] failed to start', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('[api-server] shutdown failed', error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('[api-server] shutdown failed', error);
    process.exit(1);
  });
});
