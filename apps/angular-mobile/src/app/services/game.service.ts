import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatchPayload, MatchAction, MatchCard } from '../../../../next-api/lib/matchEngine';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private _matchState = new BehaviorSubject<MatchPayload | null>(null);
  public matchState$ = this._matchState.asObservable();

  private apiBase = 'https://fractured-earth.vercel.app/api';

  constructor(private http: HttpClient) {}

  /**
   * Initialize a new match via Next.js API
   */
  async initMatch(botCount: number = 3) {
    try {
      const response = await this.http.post<MatchPayload>(`${this.apiBase}/match/init`, { botCount }).toPromise();
      if (response) {
        this._matchState.next(response);
      }
    } catch (e) {
      console.error('Failed to initialize match', e);
    }
  }

  /**
   * Sync local action with MongoDB/Next.js backend
   */
  async performAction(action: MatchAction) {
    const currentState = this._matchState.value;
    if (!currentState) return;

    try {
      const response = await this.http.post<MatchPayload>(`${this.apiBase}/match/action`, { 
        matchId: (currentState as any).id, 
        action 
      }).toPromise();
      
      if (response) {
        this._matchState.next(response);
      }
    } catch (e) {
      console.error('Action failed', e);
    }
  }

  /**
   * Local Helper for card effects (Ported from MatchEngine)
   */
  getCardDescription(card: MatchCard): string {
    return card.description || card.effect || 'No effect';
  }
}
