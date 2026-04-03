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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  private readonly API_BASE = 'https://fractured-earth.vercel.app/api'; // Update with your actual domain

  constructor(private http: HttpClient) {
    this.loadLocalProfile();
  }

  async loadLocalProfile() {
    const { value } = await Preferences.get({ key: 'user_profile' });
    if (value) {
      this.userProfileSubject.next(JSON.parse(value));
    }
  }

  async loginWithGoogle() {
    // Note: For Capacitor, we usually use the Google Auth Plugin
    // or redirect to a web-based login flow.
    // Here we'll simulate the redirect to the Next-Auth endpoint.
    window.location.href = `${this.API_BASE}/auth/signin/google`;
  }

  async syncWithGuest(guestData: { totalWins: number, emoji: string, displayName: string }) {
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
