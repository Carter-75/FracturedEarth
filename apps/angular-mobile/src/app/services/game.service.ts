import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatchPayload, MatchAction, MatchCard } from '@match-engine';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private _matchState = new BehaviorSubject<MatchPayload | null>(null);
  public matchState$ = this._matchState.asObservable();

  getMatchStateValue() {
    return this._matchState.value;
  }

  // Use environment variables for the API URL in a real mobile app
  private apiBase = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://fractured-earth.vercel.app/api';
  private heartbeatInterval: any;

  constructor(private http: HttpClient) {}

  /**
   * High-Frequency Pulse (1s)
   * Combined Heartbeat + Polling to prevent race conditions
   */
  startPulse(roomCode: string, userId: string) {
    this.stopPulse();
    this.heartbeatInterval = setInterval(async () => {
      try {
        // 1. Send Heartbeat (Pulse)
        await this.http.post(`${this.apiBase}/rooms/${roomCode}/heartbeat`, { userId }).toPromise();
        // 2. Poll State (Sync) - Only if pulse succeeds
        this.pollMatchState(roomCode);
      } catch (e) {
        // Silent pulse fail
      }
    }, 1000);
  }

  stopPulse() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Initialize a new match for a room
   */
  async initRoomMatch(roomCode: string, hostUserId: string) {
    try {
      const response = await this.http.post<MatchPayload>(`${this.apiBase}/rooms/${roomCode}/start`, { hostUserId }).toPromise();
      if (response) {
        this._matchState.next(response);
      }
    } catch (e) {
      console.error('Failed to initiate room match', e);
    }
  }

  /**
   * Sync local action with MongoDB/Next.js backend
   */
  async performAction(roomCode: string, userId: string, action: MatchAction) {
    try {
      const response = await this.http.post<MatchPayload>(`${this.apiBase}/rooms/${roomCode}/action`, { 
        userId, 
        action 
      }).toPromise();
      
      if (response) {
        this._matchState.next(response);
      }
    } catch (e: any) {
      if (e.status === 400 && e.error?.includes('kicked')) {
        this._matchState.next(null);
      }
      console.error('Action failed', e);
    }
  }

  /**
   * Kick a player (Host only)
   */
  async kickPlayer(roomCode: string, hostUserId: string, targetUserId: string) {
    try {
      await this.http.post(`${this.apiBase}/rooms/${roomCode}/kick`, { 
        hostUserId, 
        targetUserId 
      }).toPromise();
    } catch (e) {
      console.error('Kick failed', e);
    }
  }

  /**
   * Poll for match state (syncs bot turns and rival actions)
   */
  async pollMatchState(roomCode: string) {
    try {
      const response = await this.http.get<MatchPayload>(`${this.apiBase}/rooms/${roomCode}/state`).toPromise();
      if (response) {
        this._matchState.next(response);
      }
    } catch (e) {
      // Background poll - silent error
    }
  }

  /**
   * Discover local rooms for "Multiplayer Local" mode
   */
  async getNearbyRooms(): Promise<any[]> {
    try {
      return (await this.http.get<any[]>(`${this.apiBase}/rooms/nearby`).toPromise()) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Local Helper for card effects (Ported from MatchEngine)
   */
  getCardDescription(card: MatchCard): string {
    return card.name + ': ' + (card.description || card.effect || 'No effect');
  }
}
