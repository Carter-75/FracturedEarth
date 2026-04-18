import { Injectable } from '@angular/core';
import { getAllCards, type MatchCard, type ServerMatchSnapshot } from '@fractured-earth/game-core';

export interface SessionUser {
  userId: string;
  displayName: string;
  email?: string;
  emoji: string;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
}

export interface BootstrapInfo {
  queueId: string;
  gameModes: string[];
  maxPlayers: number;
  cardCount: number;
  googleClientId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = (globalThis as any)?.__env?.API_URL || 'http://localhost:3100';

  async bootstrap(): Promise<BootstrapInfo> {
    const res = await fetch(`${this.baseUrl}/config/bootstrap`);
    return res.json();
  }

  async loginWithGoogle(credential: string, emoji = '🌍'): Promise<AuthSession> {
    const res = await fetch(`${this.baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, emoji }),
    });
    if (!res.ok) throw new Error('Google login failed');
    return res.json();
  }

  async login(email: string, displayName: string): Promise<AuthSession> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  }

  async createGuest(displayName: string, emoji: string): Promise<AuthSession> {
    const res = await fetch(`${this.baseUrl}/guest/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, emoji }),
    });
    if (!res.ok) throw new Error('Guest session failed');
    return res.json();
  }

  async startPractice(user: SessionUser, token: string): Promise<ServerMatchSnapshot> {
    const res = await fetch(`${this.baseUrl}/match/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Practice start failed');
    return res.json();
  }

  async createPrivateRoom(token: string, emoji: string) {
    const res = await fetch(`${this.baseUrl}/rooms/private`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) throw new Error('Private room creation failed');
    return res.json();
  }

  async fetchCatalog(): Promise<MatchCard[]> {
    const res = await fetch(`${this.baseUrl}/catalog/cards`);
    if (!res.ok) {
      return getAllCards();
    }
    const data = await res.json();
    return data.cards;
  }
}
