import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

export interface UserProfile {
  id: string; // MongoDB _id
  email: string;
  displayName: string;
  emoji: string;
  totalWins: number;
  isPro: boolean;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  private readonly API_BASE = 'https://fractured-earth.vercel.app/api'; 
  private readonly SETTINGS_KEY = 'fe:user-settings:v1';
  private readonly LEGACY_KEY = 'user_profile';

  private syncSubject = new Subject<Partial<UserProfile>>();
  private lastLocalUpdateAt = 0;

  constructor(private http: HttpClient) {
    this.loadLocalProfile();
    this.setupSyncPipeline();
  }

  private setupSyncPipeline() {
    this.syncSubject.pipe(
      debounceTime(500),
      switchMap(updates => {
        const currentProfile = this.userProfileSubject.value;
        if (currentProfile && currentProfile.id !== 'guest') {
          console.log('[Auth] Debounced Sync: Pushing to cloud...');
          return this.http.patch(`${this.API_BASE}/user/profile`, updates);
        }
        return [];
      })
    ).subscribe({
      next: () => console.log('[Auth] Profile synced with server.'),
      error: (err) => console.error('[Auth] Failed to sync profile:', err)
    });
  }

  async loadLocalProfile() {
    let raw = (await Preferences.get({ key: this.SETTINGS_KEY })).value;
    
    // Migration: Check for legacy key if new key doesn't exist
    if (!raw) {
      const legacyRaw = (await Preferences.get({ key: this.LEGACY_KEY })).value;
      if (legacyRaw) {
        console.log('[Auth] Migrating legacy profile to shared storage...');
        raw = legacyRaw;
        // Save to new key immediately
        await Preferences.set({ key: this.SETTINGS_KEY, value: raw });
        // Optional: Remove legacy key
        await Preferences.remove({ key: this.LEGACY_KEY });
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      // Map shared LocalUserSettings to UserProfile interface
      const profile: UserProfile = {
        id: parsed.userId || 'guest',
        email: parsed.email || '',
        displayName: parsed.displayName || 'Guest',
        emoji: parsed.emoji || '🌍',
        totalWins: parsed.totalWins || 0,
        isPro: parsed.isPro || false,
        metadata: parsed.metadata || {}
      };
      this.userProfileSubject.next(profile);
    }
  }

  async fetchLatestProfile(): Promise<UserProfile | null> {
    try {
      // PRECEDENCE: If a local update just happened, don't pull from cloud yet
      const now = Date.now();
      if (now - this.lastLocalUpdateAt < 2000) {
        console.log('[Auth] Skipping auto-pull: Local update is very recent.');
        return null;
      }

      const response = await firstValueFrom(
        this.http.get<{ profile: UserProfile }>(`${this.API_BASE}/user/profile`)
      );
      if (response && response.profile) {
        // Double check precedence again after request completes
        if (Date.now() - this.lastLocalUpdateAt < 2000) return null;
        
        await this.saveProfile(response.profile);
        return response.profile;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch profile from server:', error);
      return null;
    }
  }

  async loginWithGoogle() {
    window.location.href = `${this.API_BASE}/auth/signin/google`;
  }

  async syncWithGuest(guestData: any) {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_BASE}/user/sync`, { guestStats: guestData })
      );
      
      if (response.profile) {
        await this.saveProfile(response.profile);
      }
      return response;
    } catch (error) {
      console.error('Failed to sync profile:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<UserProfile>) {
    const currentProfile = this.userProfileSubject.value;
    this.lastLocalUpdateAt = Date.now();
    
    // 1. Immediately update Local Storage for "Warp Speed" UX
    const newProfile = currentProfile 
      ? { ...currentProfile, ...updates }
      : { 
          id: 'guest', 
          email: '', 
          displayName: 'Guest', 
          emoji: '🌍', 
          totalWins: 0, 
          isPro: false, 
          ...updates 
        } as UserProfile;

    await this.saveProfile(newProfile);

    // 2. Queue for debounced cloud sync
    if (currentProfile && currentProfile.id !== 'guest') {
      this.syncSubject.next(updates);
    }
  }

  async saveProfile(profile: UserProfile) {
    // Map UserProfile back to the shared storage format (LocalUserSettings)
    const sharedData = {
      userId: profile.id,
      displayName: profile.displayName,
      emoji: profile.emoji,
      email: profile.email,
      totalWins: profile.totalWins,
      isPro: profile.isPro,
      metadata: profile.metadata || {},
      // Preserve other web-specific settings if they exist
      theme: (profile as any).theme || 'Obsidian',
      soundEnabled: (profile as any).soundEnabled !== undefined ? (profile as any).soundEnabled : true,
    };

    await Preferences.set({
      key: this.SETTINGS_KEY,
      value: JSON.stringify(sharedData)
    });
    this.userProfileSubject.next(profile);
    
    // Dispatch event for cross-app synchronization (if under the same origin)
    window.dispatchEvent(new CustomEvent('fe:settings-changed', { detail: sharedData }));
  }

  async logout() {
    await Preferences.remove({ key: 'user_profile' });
    this.userProfileSubject.next(null);
    // Also call NextAuth signout
    this.http.post(`${this.API_BASE}/auth/signout`, {}).subscribe();
  }
}
