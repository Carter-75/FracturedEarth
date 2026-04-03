import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchPayload } from '@match-engine';

@Component({
  selector: 'app-score-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-panel.component.html',
  styleUrls: ['./score-panel.component.scss']
})
export class ScorePanelComponent {
  @Input() state!: MatchPayload;

  getRoundLabel(): string {
    return `PHASE_${this.state.round.toString().padStart(2, '0')}`;
  }

  getWinningScore(): number {
    return Math.max(...this.state.players.map(p => p.survivalPoints));
  }
}
