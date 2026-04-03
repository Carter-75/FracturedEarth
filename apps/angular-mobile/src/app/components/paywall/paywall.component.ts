import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-capacitor';

@Component({
  selector: 'app-paywall',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paywall-overlay glass-heavy animate-fade-in">
      <div class="paywall-card glass-glow">
        <div class="paywall-header">
          <button class="close-btn" (click)="close.emit()">×</button>
          <div class="fe-hologram text-[10px] text-[var(--accent)] tracking-widest opacity-60">ACCESS_RESTRICTED</div>
          <h2 class="text-3xl font-black italic uppercase leading-none mt-2">
            FRACTURED <span class="text-[var(--accent)]">EARTH PRO</span>
          </h2>
          <p class="text-[10px] opacity-40 font-mono mt-1 italic tracking-tight">ENHANCED_BIOSPHERE_LINK_1.0.4</p>
        </div>

        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon">🚫</span>
            <div class="feature-text">
              <div class="font-black text-xs uppercase italic">REMOVE_ADS</div>
              <div class="text-[10px] opacity-40">Zero interference from AD-SENSE/AD-MOB signals.</div>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <div class="feature-text">
              <div class="font-black text-xs uppercase italic">UNLIMITED_SYNC</div>
              <div class="text-[10px] opacity-40">No limits on match re-connections or lobby creation.</div>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎭</span>
            <div class="feature-text">
              <div class="font-black text-xs uppercase italic">PREMIUM_THEMES</div>
              <div class="text-[10px] opacity-40">Instant access to all 10 sector-hologram themes.</div>
            </div>
          </div>
        </div>

        <div class="offerings-grid" *ngIf="offering">
          <div *ngFor="let pkg of offering.availablePackages" 
               class="offering-item glass-border"
               (click)="selectPackage(pkg)">
            <div class="text-[8px] opacity-40 font-mono text-left mb-1 uppercase tracking-widest">{{ pkg.packageType }}</div>
            <div class="flex justify-between items-center">
              <div class="text-sm font-black italic uppercase">{{ getPackageName(pkg) }}</div>
              <div class="text-[var(--accent)] font-black text-sm">{{ pkg.product.priceString }}</div>
            </div>
          </div>
        </div>

        <div class="paywall-footer">
          <p class="text-[8px] opacity-20 italic leading-tight uppercase font-mono tracking-tighter">
            * SUBSCRIPTION WILL AUTO-RENEW UNTIL CANCELLED. NO REFUNDS ISSUED FOR PARTIAL REMAINDER OF BILLING PERIODS. 
            UPGRADES/DOWNGRADES PROCESSED IMMEDIATELY VIA GOOGLE PLAY SECURE LINK.
          </p>
          <button (click)="restorePurchases()" class="restore-btn">RESTORE_PRIOR_LINK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .paywall-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
    }
    .paywall-card {
      width: 90%; max-width: 400px; padding: 2rem; border-radius: 2rem;
      border: 1px solid rgba(255,255,255,0.1); text-align: center;
      background: radial-gradient(circle at top right, rgba(0,255,242,0.05), transparent 70%);
    }
    .paywall-header { position: relative; margin-bottom: 2rem; }
    .close-btn { 
      position: absolute; top: -1rem; right: -1rem; background: none; border: none;
      color: rgba(255,255,255,0.2); font-size: 2rem; cursor: pointer; transition: 0.2s;
    }
    .close-btn:hover { color: var(--accent); }
    .features-list { display: grid; gap: 1rem; margin-bottom: 2rem; text-align: left; }
    .feature-item { display: flex; gap: 1rem; align-items: center; }
    .feature-icon { font-size: 1.25rem; }
    .offerings-grid { display: grid; gap: 0.75rem; margin-bottom: 2rem; }
    .offering-item { 
      padding: 1rem; border-radius: 1rem; cursor: pointer; transition: 0.3s;
      background: rgba(255,255,255,0.02);
    }
    .offering-item:hover { 
      background: rgba(var(--accent-rgb), 0.1);
      border-color: var(--accent);
      transform: scale(1.02);
    }
    .paywall-footer {  }
    .restore-btn {
      margin-top: 1rem; background: none; border: none; font-family: 'Mono';
      font-size: 8px; color: var(--accent); text-transform: uppercase;
      letter-spacing: 2px; cursor: pointer; opacity: 0.6;
    }
    .restore-btn:hover { opacity: 1; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class PaywallComponent {
  @Input() offering: PurchasesOffering | null = null;
  @Output() purchase = new EventEmitter<PurchasesPackage>();
  @Output() restore = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  getPackageName(pkg: PurchasesPackage): string {
    switch (pkg.packageType) {
      case 'MONTHLY': return 'CLEAR_LINK';
      case 'ANNUAL': return 'OPTIMIZED_LINK';
      case 'LIFETIME': return 'ETERNAL_LINK';
      default: return pkg.packageType;
    }
  }

  selectPackage(pkg: PurchasesPackage) {
    this.purchase.emit(pkg);
  }

  restorePurchases() {
    this.restore.emit();
  }
}
