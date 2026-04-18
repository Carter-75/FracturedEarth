import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { type MatchAction, type ServerMatchSnapshot } from '@fractured-earth/game-core';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;
  private currentToken?: string;
  readonly baseUrl = (globalThis as any)?.__env?.API_URL || 'http://localhost:3100';

  connect(token?: string) {
    if (this.socket && this.currentToken === token) return this.socket;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }

    this.currentToken = token;
    this.socket = io(this.baseUrl, {
      auth: token ? { token: `Bearer ${token}` } : {},
    });
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.currentToken = undefined;
  }

  onSnapshot(handler: (snapshot: ServerMatchSnapshot) => void) {
    this.socket?.on('match:snapshot', handler);
  }

  onRoom(handler: (room: any) => void) {
    this.socket?.on('room:update', handler);
  }

  onQueue(handler: (queue: any[]) => void) {
    this.socket?.on('queue:update', handler);
  }

  onError(handler: (payload: { message: string }) => void) {
    this.socket?.on('match:error', handler);
  }

  emit(event: string, payload?: unknown) {
    this.socket?.emit(event, payload);
  }

  joinQueue(emoji: string) {
    this.emit('queue:join', { emoji });
  }

  leaveQueue() {
    this.emit('queue:leave');
  }

  createRoom(emoji: string) {
    this.emit('room:create', { emoji });
  }

  joinRoom(code: string, emoji: string) {
    this.emit('room:join', { code, emoji });
  }

  addBot(code: string) {
    this.emit('room:addBot', { code });
  }

  startRoom(code: string) {
    this.emit('room:start', { code });
  }

  reconnect(matchId: string, actorUserId?: string) {
    this.emit('match:reconnect', { matchId, actorUserId });
  }

  submitAction(matchId: string, actorUserId: string, action: MatchAction) {
    this.emit('match:action', { matchId, actorUserId, action });
  }
}
