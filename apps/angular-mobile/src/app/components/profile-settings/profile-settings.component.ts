import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div class="fe-hologram w-full max-w-md bg-black/60 border border-[var(--accent)]/30 p-8 rounded-2xl space-y-8 relative overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="text-[var(--accent)] text-[8px] font-black tracking-[0.3em] uppercase opacity-60 italic">Identity_Protocol_v2</div>
            <h2 class="text-3xl font-black italic text-white uppercase tracking-tighter">Sync Profile</h2>
          </div>
          <button (click)="close.emit()" class="text-white/20 hover:text-white transition-colors text-2xl">×</button>
        </div>

        <!-- Emoji Selection -->
        <div class="space-y-3">
          <label class="text-[10px] font-extrabold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <span>Select_Avatar</span>
            <span class="h-px flex-1 bg-white/5"></span>
          </label>
          <div class="grid grid-cols-5 gap-3">
            <button 
              *ngFor="let e of emojis" 
              (click)="onEmojiSelect(e)"
              [class.bg-[var(--accent)]]="selectedEmoji === e"
              [class.fe-glow]="selectedEmoji === e"
              [class.scale-110]="selectedEmoji === e"
              class="text-2xl p-3 rounded-xl hover:bg-white/10 transition-all border border-white/5 active:scale-95 flex items-center justify-center bg-white/5"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <!-- Name Input -->
        <div class="space-y-3">
          <label class="text-[10px] font-extrabold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <span>Codename_Input</span>
            <span class="h-px flex-1 bg-white/5"></span>
          </label>
           <div class="relative group">
            <input 
              [(ngModel)]="displayName" 
              (ngModelChange)="onNameChange()"
              placeholder="Enter Name..."
              maxlength="15"
              class="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-wide focus:border-[var(--accent)] focus:bg-[var(--accent)]/10 outline-none transition-all placeholder:text-white/10 pr-12"
            />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
               <span class="animate-pulse text-[var(--accent)]">⚡</span>
            </div>
          </div>
        </div>

        <!-- Footer / Status -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-2">
             <div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent)]"></div>
             <span class="text-[8px] font-black tracking-widest text-[var(--accent)] uppercase opacity-60">Neural_Link_Stable</span>
          </div>
          <div class="text-[8px] text-white/20 uppercase font-mono italic">Changes_Auto_Synced</div>
        </div>

        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .fe-glow { box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3); }
  `]
})
export class ProfileSettingsComponent implements OnDestroy {
  @Input() profile: UserProfile | null = null;
  @Output() close = new EventEmitter<void>();

  displayName = '';
  selectedEmoji = '🌍';
  emojis = ['🌍', '🔥', '⚡', '🌊', '🪨', '🌪️', '🌙', '☀️', '🛰️', '🦾'];

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {
    this.saveSubject.pipe(
      debounceTime(600),
      takeUntil(this.destroy$)
    ).subscribe(() => this.executeSave());
  }

  ngOnInit() {
    if (this.profile) {
      this.displayName = this.profile.displayName;
      this.selectedEmoji = this.profile.emoji;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEmojiSelect(emoji: string) {
    this.selectedEmoji = emoji;
    this.saveSubject.next();
  }

  onNameChange() {
    this.saveSubject.next();
  }

  private async executeSave() {
    await this.authService.updateProfile({
      displayName: this.displayName || 'Player',
      emoji: this.selectedEmoji
    });
    console.log('[Settings] Profile Auto-Synced');
  }
}
