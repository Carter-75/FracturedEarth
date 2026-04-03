import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface MatchHistoryEntry {
  roomCode: string;
  finishedAt: number;
  winnerUserId: string;
  myScore: number;
  result: 'WIN' | 'LOSS' | 'DRAW';
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private STORAGE_KEY = 'fe_match_history';

  constructor() {}

  async saveMatchResult(entry: MatchHistoryEntry) {
    const history = await this.getHistory();
    history.unshift(entry);
    // Keep last 50 matches
    const limited = history.slice(0, 50);
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(limited)
    });
  }

  async getHistory(): Promise<MatchHistoryEntry[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }
}
