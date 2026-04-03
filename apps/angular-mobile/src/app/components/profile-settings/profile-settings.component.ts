import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[300] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div class="fe-hologram w-full max-w-md bg-black/60 border border-[var(--accent)]/30 p-8 rounded-2xl space-y-8 relative overflow-hidden">
        
        <!-- Header -->
        <div class="space-y-2">
          <div class="text-[var(--accent)] text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Identity_Protocol_v2</div>
          <h2 class="text-3xl font-black italic text-white uppercase tracking-tighter">Adjust Profile</h2>
        </div>

        <!-- Emoji Selection -->
        <div class="space-y-3">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select_Avatar</label>
          <div class="grid grid-cols-6 gap-3">
            <button 
              *ngFor="let e of emojis" 
              (click)="selectedEmoji = e"
              [class.bg-[var(--accent)]]="selectedEmoji === e"
              [class.scale-110]="selectedEmoji === e"
              class="text-2xl p-2 rounded-lg hover:bg-white/10 transition-all border border-white/5 active:scale-90"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <!-- Name Input -->
        <div class="space-y-3">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Codename_Input</label>
          <input 
            [(ngModel)]="displayName" 
            placeholder="Enter Name..."
            class="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-wide focus:border-[var(--accent)] focus:bg-[var(--accent)]/10 outline-none transition-all"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-4">
          <button (click)="save()" class="flex-1 fe-holo-btn !bg-[var(--accent)]/20 !border-[var(--accent)] !text-[var(--accent)] !py-4 font-black tracking-widest uppercase">
            Save_Sync
          </button>
          <button (click)="close.emit()" class="flex-1 fe-holo-btn !bg-white/5 !border-white/10 !text-white/40 !py-4 font-black tracking-widest uppercase">
            Cancel
          </button>
        </div>

        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)]/10 blur-[100px] rounded-full"></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProfileSettingsComponent {
  @Input() profile: UserProfile | null = null;
  @Output() close = new EventEmitter<void>();

  displayName = '';
  selectedEmoji = '👤';

  emojis = ['👤', '🤖', '💀', '👽', '👾', '🦊', '🐲', '⚡', '🔥', '💧', '🌿', '💎'];

  ngOnInit() {
    if (this.profile) {
      this.displayName = this.profile.displayName;
      this.selectedEmoji = this.profile.emoji;
    }
  }

  constructor(private authService: AuthService) {}

  async save() {
    await this.authService.updateProfile({
      displayName: this.displayName || 'Player',
      emoji: this.selectedEmoji
    });
    this.close.emit();
  }
}
