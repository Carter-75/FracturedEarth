import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GAME_THEME, type MatchAction, type MatchCard, type MatchPayload, type ServerMatchSnapshot } from '@fractured-earth/game-core';
import { ApiService, type AuthSession, type BootstrapInfo, type SessionUser } from './api.service';
import { SocketService } from './socket.service';

type ViewMode = 'home' | 'practice' | 'live' | 'private' | 'store' | 'profile';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

@Component({
  selector: 'fe-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly sockets = inject(SocketService);
  private readonly document = inject(DOCUMENT);
  private listenersBound = false;
  private googleScriptLoaded = false;

  readonly theme = GAME_THEME;
  readonly slotIndexes = [0, 1, 2, 3];

  @ViewChild('googleButtonHost') googleButtonHost?: ElementRef<HTMLDivElement>;

  viewMode: ViewMode = 'home';
  bootstrapInfo: BootstrapInfo | null = null;
  session: AuthSession | null = null;
  guest: AuthSession | null = null;
  room: any = null;
  queue: any[] = [];
  snapshot: ServerMatchSnapshot | null = null;
  catalog: MatchCard[] = [];
  selectedCard: MatchCard | null = null;
  selectedSlot = 0;
  statusMessage = 'Rebuild online. Practice, live queue, and private rooms now share one rules core.';
  roomCodeInput = '';
  guestName = 'Guest Commander';
  guestEmoji = '🌍';

  async ngOnInit() {
    this.bootstrapInfo = await this.api.bootstrap().catch(() => null);
    this.catalog = await this.api.fetchCatalog();

    const savedSession = localStorage.getItem('fe_session');
    if (savedSession) {
      this.session = JSON.parse(savedSession) as AuthSession;
      this.connectSockets();
    }

    await this.ensureGoogleScript();
    this.renderGoogleButton();
  }

  ngAfterViewInit() {
    this.renderGoogleButton();
  }

  get currentUser(): SessionUser | null {
    return this.session?.user || this.guest?.user || null;
  }

  get payload(): MatchPayload | null {
    return this.snapshot?.payload || null;
  }

  get myPlayer() {
    return this.payload?.players.find((player) => player.id === this.currentUser?.userId) || null;
  }

  get activePlayer() {
    if (!this.payload) return null;
    return this.payload.players[this.payload.activePlayerIndex];
  }

  get googleAuthEnabled() {
    return Boolean(this.bootstrapInfo?.googleClientId);
  }

  async loginWithGoogleCredential(credential: string) {
    this.session = await this.api.loginWithGoogle(credential, this.guestEmoji);
    this.guest = null;
    localStorage.setItem('fe_session', JSON.stringify(this.session));
    this.statusMessage = `Authenticated as ${this.session.user.displayName}. Live queue and private rooms unlocked.`;
    this.connectSockets();
  }

  async continueAsGuest() {
    const payload = await this.api.createGuest(this.guestName, this.guestEmoji);
    const guest = payload;
    this.guest = guest;
    this.connectSockets();
    this.statusMessage = `Guest practice session ready for ${guest.user.displayName}.`;
    this.viewMode = 'practice';
  }

  logout() {
    this.session = null;
    this.guest = null;
    localStorage.removeItem('fe_session');
    this.sockets.disconnect();
    this.snapshot = null;
    this.room = null;
    this.queue = [];
    this.statusMessage = 'Signed out. Practice mode remains available for guests.';
    this.viewMode = 'home';
  }

  private async ensureGoogleScript() {
    if (this.googleScriptLoaded || !this.googleAuthEnabled) return;
    const existing = this.document.getElementById('google-identity-script') as HTMLScriptElement | null;
    if (existing) {
      this.googleScriptLoaded = true;
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleScriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google sign-in script'));
      this.document.head.appendChild(script);
    }).catch(() => {
      this.statusMessage = 'Google sign-in could not be loaded. Guest practice is still available.';
    });
  }

  private renderGoogleButton() {
    if (!this.googleAuthEnabled || !this.googleButtonHost?.nativeElement || !window.google?.accounts?.id) {
      return;
    }

    const host = this.googleButtonHost.nativeElement;
    host.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: this.bootstrapInfo?.googleClientId || '',
      callback: ({ credential }) => {
        this.loginWithGoogleCredential(credential).catch(() => {
          this.statusMessage = 'Google sign-in failed. Please try again.';
        });
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(host, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: 280,
    });
  }

  private connectSockets() {
    const token = this.session?.token || this.guest?.token;
    const socket = this.sockets.connect(token);
    if (!this.listenersBound) {
      this.sockets.onSnapshot((snapshot) => {
        this.snapshot = snapshot;
        this.viewMode = snapshot.mode === 'practice' ? 'practice' : snapshot.mode === 'live' ? 'live' : 'private';
        this.statusMessage = `Match ${snapshot.matchId} synced at revision ${snapshot.revision}.`;
      });
      this.sockets.onRoom((room) => {
        this.room = room;
        this.viewMode = 'private';
        this.statusMessage = `Private room ${room.code} synced for ${room.members.length} member(s).`;
      });
      this.sockets.onQueue((queue) => {
        this.queue = queue;
      });
      this.sockets.onError((error) => {
        this.statusMessage = error.message;
      });
      this.listenersBound = true;
    }
    socket.emit('presence:ping');
  }

  async startPractice() {
    if (!this.currentUser) {
      await this.continueAsGuest();
    }
    if (!this.currentUser) return;
    const token = this.session?.token || this.guest?.token;
    if (!token) {
      this.statusMessage = 'Signed session required before starting practice.';
      return;
    }
    this.connectSockets();
    this.snapshot = await this.api.startPractice(this.currentUser, token);
    this.sockets.reconnect(this.snapshot.matchId, this.currentUser.userId);
    this.viewMode = 'practice';
    this.statusMessage = `Practice match ${this.snapshot.matchId} deployed.`;
  }

  joinQueue() {
    if (!this.session) return;
    this.connectSockets();
    this.viewMode = 'live';
    this.statusMessage = 'Queued for live online match...';
    this.sockets.joinQueue(this.currentUser?.emoji || '🌍');
  }

  leaveQueue() {
    this.sockets.leaveQueue();
    this.statusMessage = 'Exited public queue.';
  }

  async createPrivateRoom() {
    if (!this.session) return;
    this.connectSockets();
    this.room = null;
    this.viewMode = 'private';
    this.statusMessage = 'Creating private room and waiting for room sync...';
    this.sockets.createRoom(this.currentUser?.emoji || '🌍');
  }

  joinPrivateRoom() {
    if (!this.session || !this.roomCodeInput) return;
    this.connectSockets();
    this.viewMode = 'private';
    this.statusMessage = `Joining room ${this.roomCodeInput.toUpperCase()}...`;
    this.sockets.joinRoom(this.roomCodeInput.toUpperCase(), this.currentUser?.emoji || '🌍');
  }

  addBot() {
    if (!this.room?.code) return;
    this.sockets.addBot(this.room.code);
  }

  startRoom() {
    if (!this.room?.code) return;
    this.sockets.startRoom(this.room.code);
  }

  selectCard(card: MatchCard) {
    this.selectedCard = card;
  }

  playSelected(slotIndex: number) {
    if (!this.snapshot || !this.selectedCard || !this.currentUser) return;
    const action: MatchAction = {
      type: 'PLAY_CARD',
      cardId: this.selectedCard.id,
      slotIndex,
    };

    if (this.snapshot.mode === 'practice') {
      this.sockets.submitAction(this.snapshot.matchId, this.currentUser.userId, action);
    } else {
      this.sockets.submitAction(this.snapshot.matchId, this.currentUser.userId, action);
    }
    this.selectedCard = null;
  }

  drawCard() {
    if (!this.snapshot || !this.currentUser) return;
    this.sockets.submitAction(this.snapshot.matchId, this.currentUser.userId, { type: 'DRAW_CARD' });
  }

  endTurn() {
    if (!this.snapshot || !this.currentUser) return;
    this.sockets.submitAction(this.snapshot.matchId, this.currentUser.userId, { type: 'END_TURN' });
  }

  discard(card: MatchCard) {
    if (!this.snapshot || !this.currentUser) return;
    this.sockets.submitAction(this.snapshot.matchId, this.currentUser.userId, { type: 'DISCARD_CARD', cardId: card.id });
  }

  cardThumb(card: MatchCard) {
    return `/cards/${card.id}.jpg`;
  }
}
