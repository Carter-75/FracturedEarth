import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

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

  constructor(private http: HttpClient) {
    this.loadLocalProfile();
  }

  async loadLocalProfile() {
    const { value } = await Preferences.get({ key: 'user_profile' });
    if (value) {
      const profile = JSON.parse(value);
      this.userProfileSubject.next(profile);
    }
  }

  async fetchLatestProfile(): Promise<UserProfile | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ profile: UserProfile }>(`${this.API_BASE}/user/profile`)
      );
      if (response && response.profile) {
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
    
    // 1. Immediately update Local Storage for "Warp Speed" UX
    const newProfile = currentProfile 
      ? { ...currentProfile, ...updates }
      : { 
          id: 'guest', 
          email: '', 
          displayName: 'Guest', 
          emoji: '👤', 
          totalWins: 0, 
          isPro: false, 
          ...updates 
        } as UserProfile;

    await this.saveProfile(newProfile);

    // 2. If signed in, sync to server in background
    if (currentProfile && currentProfile.id !== 'guest') {
      try {
        await firstValueFrom(
          this.http.patch(`${this.API_BASE}/user/profile`, updates)
        );
        console.log('[Auth] Profile synced with server.');
      } catch (error) {
        console.error('[Auth] Failed to sync profile with server:', error);
      }
    }
  }

  async saveProfile(profile: UserProfile) {
    await Preferences.set({
      key: 'user_profile',
      value: JSON.stringify(profile)
    });
    this.userProfileSubject.next(profile);
  }

  async logout() {
    await Preferences.remove({ key: 'user_profile' });
    this.userProfileSubject.next(null);
    // Also call NextAuth signout
    this.http.post(`${this.API_BASE}/auth/signout`, {}).subscribe();
  }
}
