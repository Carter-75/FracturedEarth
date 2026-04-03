import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchCard } from '@match-engine';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss']
})
export class GameCardComponent {
  @Input() card!: MatchCard;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() glow: boolean = false;
  
  @Output() cardSelect = new EventEmitter<MatchCard>();

  getTypeColor(): string {
    switch(this.card.type) {
      case 'SURVIVAL': return 'var(--accent)';
      case 'POWER': return '#f59e0b';
      case 'CHAOS': return '#ef4444';
      case 'ADAPT': return '#8b5cf6';
      case 'TWIST': return '#06b6d4';
      case 'CATACLYSM': return '#f43f5e';
      default: return 'var(--fg)';
    }
  }

  onSelect() {
    if (!this.disabled) {
      this.cardSelect.emit(this.card);
    }
  }
}
