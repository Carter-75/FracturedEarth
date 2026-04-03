import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { App } from '@capacitor/app';

import { GameService } from './services/game.service';
import { PaymentService } from './services/payment.service';
import { AdService } from './services/ad.service';

import { GameBoardComponent } from './components/game-board/game-board.component';
import { GameCardComponent } from './components/game-card/game-card.component';
import { PaywallComponent } from './components/paywall/paywall.component';
import { PlayerHandComponent } from './components/player-hand/player-hand.component';
import { ScorePanelComponent } from './components/score-panel/score-panel.component';
import { MatchCard } from '@match-engine';
import { HistoryService } from './services/history.service';
import { AuthService, UserProfile } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    GameBoardComponent, 
    GameCardComponent,
    PlayerHandComponent, 
    ScorePanelComponent,
    PaywallComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'Fractured Earth';
  matchState$;
  nearbyRooms: any[] = [];
  currentRoomCode = ''; 
  currentUserId = ''; 
  
  isLoggedIn = false;
  userProfile: UserProfile | null = null;
  playerName = 'Guest';
  emoji = '👤';
  authDropdownOpen = false;

  themes = [
    'obsidian', 'deep-teal', 'electric-indigo', 'crimson-night', 
    'forest-signal', 'carbon-gold', 'arctic-terminal', 'solar-flare', 
    'void-purple', 'titanium-slate'
  ];
  
  isPro$;
  offerings$;
  showPaywallOverlay = false;
  showPauseOverlay = false;
  showContinueButton = false;
  disconnectedUser = '';
  currentTheme = 'obsidian';
  selectedCard: MatchCard | null = null;

  constructor(
    private gameService: GameService,
    private paymentService: PaymentService,
    private adService: AdService,
    private historyService: HistoryService,
    private authService: AuthService
  ) {
    this.matchState$ = this.gameService.matchState$;
    this.isPro$ = this.paymentService.isPro$;
    this.offerings$ = this.paymentService.offerings$;

    this.authService.userProfile$.subscribe(async (profile) => {
      this.userProfile = profile;
      this.isLoggedIn = !!profile;
      
      if (profile) {
        this.playerName = profile.displayName;
        this.emoji = profile.emoji;
        
        // SYNC: Tell RevenueCat who this user is (Google UID)
        if (Capacitor.isNativePlatform()) {
          console.log(`[RevenueCat] Syncing User ID: ${profile.id}`);
          await this.paymentService.login(profile.id);
        }
        
        // AUTO_SYNC: If guest wins are detected, merge them immediately
        const guestWins = Number(localStorage.getItem('fe_total_wins') || '0');
        if (guestWins > 0 && profile.totalWins < guestWins) {
          console.log('[Auth] Detected guest data, triggering auto-sync...');
          await this.syncGuestStats();
        }
      } else {
        // If logged out, reset RevenueCat to a guest
        if (Capacitor.isNativePlatform()) {
          console.log('[RevenueCat] Logging out...');
          await this.paymentService.logout();
        }
      }
    });
  }

  toggleAuthDropdown() {
    this.authDropdownOpen = !this.authDropdownOpen;
  }

  async login() {
    this.authDropdownOpen = false;
    await this.authService.loginWithGoogle();
  }

  async logout() {
    this.authDropdownOpen = false;
    await this.authService.logout();
  }

  deleteAccount() {
    // Redirect to the account management / deletion page
    window.location.href = 'https://fractured-earth.vercel.app/profile/delete';
  }

  private async syncGuestStats() {
    const guestWins = Number(localStorage.getItem('fe_total_wins') || '0');
    const guestEmoji = localStorage.getItem('fe_emoji') || '👤';

    const result = await this.authService.syncWithGuest({
      totalWins: guestWins,
      emoji: guestEmoji,
      displayName: this.playerName
    });

    if (result) {
      localStorage.removeItem('fe_total_wins');
      console.log('[Auth] Guest data synchronized successfully.');
    }
  }

  async setTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    await Preferences.set({ key: 'user-theme', value: theme });
  }

  async ngOnInit() {
    console.log('Initializing Fractured Earth Mobile...');
    
    // Ad Gating Initialization
    this.adService.initializeAds();

    // Persistent Guest Identity (Phase 5)
    const { value: storedUserId } = await Preferences.get({ key: 'user-id' });
    if (storedUserId) {
      this.currentUserId = storedUserId;
    } else {
      const newId = 'guest_' + Math.random().toString(36).substr(2, 9);
      this.currentUserId = newId;
      await Preferences.set({ key: 'user-id', value: newId });
    }

    // Load persisted theme
    const { value: themeValue } = await Preferences.get({ key: 'user-theme' });
    if (themeValue && this.themes.includes(themeValue)) {
      this.setTheme(themeValue);
    }

    // Check for "Resume Sync" (Phase 5: 1 min window)
    const { value: lastRoom } = await Preferences.get({ key: 'recent-room' });
    const { value: lastActiveStr } = await Preferences.get({ key: 'last-active-time' });
    
    if (lastRoom && lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const now = Date.now();
      if (now - lastActive < 60000) {
        this.showContinueButton = true;
        this.currentRoomCode = lastRoom;
      }
    }

    // High-Frequency Pulse (1s) - Polling synchronized with Heartbeat
    setInterval(() => {
      if (this.currentRoomCode) {
        // Pulse handles BOTH heartbeat and polling now
        this.gameService.startPulse(this.currentRoomCode, this.currentUserId);
        Preferences.set({ key: 'last-active-time', value: Date.now().toString() });
      }
      this.refreshNearby();
    }, 1000);

    // Reactive State Sub (Pause & History Logic)
    this.matchState$.subscribe(async (state: any) => {
      if (state) {
        this.showPauseOverlay = state.isPaused;
        this.disconnectedUser = state.disconnectedUserId;

        if (state.isFinished) {
          this.gameService.stopPulse();
          await this.historyService.saveMatchResult({
            roomCode: this.currentRoomCode,
            finishedAt: Date.now(),
            winnerUserId: state.winnerId,
            myScore: state.players.find((p: any) => p.userId === this.currentUserId)?.score || 0,
            result: state.winnerId === this.currentUserId ? 'WIN' : 'LOSS'
          });
        }
      }
    });

    // Capacitor App Lifecycle Sync
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.currentRoomCode) {
        this.gameService.pollMatchState(this.currentRoomCode);
        this.refreshNearby();
      }
    });

    // RevenueCat SDK Initialization
    if (Capacitor.isNativePlatform()) {
      await this.paymentService.initialize("goog_zRPQbhNeOBuLYUaBamnzkuRZEEF");
    }
  }

  async goPro() {
    this.showPaywallOverlay = true;
  }

  async onPurchase(pkg: any) {
    const success = await this.paymentService.purchasePackage(pkg);
    if (success) {
      this.showPaywallOverlay = false;
    }
  }

  async onRestore() {
    await this.paymentService.restorePurchases();
  }

  async manageSubscription() {
    if (Capacitor.isNativePlatform()) {
      window.open('https://play.google.com/store/account/subscriptions', '_system');
    }
  }

  async resumeMatch() {
    if (this.currentRoomCode) {
      this.gameService.pollMatchState(this.currentRoomCode);
    }
  }

  // --- Gameplay Actions ---

  onDraw() {
    if (!this.isMyTurn()) return;
    this.gameService.performAction(this.currentRoomCode, this.currentUserId, { type: 'DRAW_CARD' });
  }

  onCardSelect(card: MatchCard) {
    this.selectedCard = card;
  }

  closeInspector() {
    this.selectedCard = null;
  }

  deploySelectedCard() {
    if (this.selectedCard && this.isMyTurn()) {
      this.onCardPlayed(this.selectedCard);
      this.closeInspector();
    }
  }

  onCardDiscard(card: MatchCard) {
    if (!this.isMyTurn()) return;
    this.gameService.performAction(this.currentRoomCode, this.currentUserId, { 
      type: 'DISCARD_CARD', 
      cardId: card.id 
    });
    this.closeInspector();
  }

  onCardPlayed(card: MatchCard) {
    if (!this.isMyTurn()) return;
    this.gameService.performAction(this.currentRoomCode, this.currentUserId, { 
      type: 'PLAY_CARD', 
      cardId: card.id 
    });
  }

  onEndTurn() {
    if (!this.isMyTurn()) return;
    this.gameService.performAction(this.currentRoomCode, this.currentUserId, { type: 'END_TURN' });
  }

  private isMyTurn(): boolean {
    const state = this.gameService.getMatchStateValue();
    if (!state) return false;
    return state.players[state.activePlayerIndex].id === this.currentUserId;
  }

  async startTestGame() {
    this.gameService.initRoomMatch(this.currentRoomCode, this.currentUserId);
    this.gameService.startPulse(this.currentRoomCode, this.currentUserId);
    await Preferences.set({ key: 'recent-room', value: this.currentRoomCode });
  }

  onKickPlayer(targetUserId: string) {
    this.gameService.kickPlayer(this.currentRoomCode, this.currentUserId, targetUserId);
  }

  async refreshNearby() {
    this.nearbyRooms = await this.gameService.getNearbyRooms();
  }

  joinLocalRoom(code: string) {
    this.currentRoomCode = code;
    this.gameService.startPulse(code, this.currentUserId);
    Preferences.set({ key: 'recent-room', value: code });
  }
}
