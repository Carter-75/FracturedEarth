import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchPayload, MatchCard } from '@match-engine';
import { GameCardComponent } from '../game-card/game-card.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent {
  @Input() state!: MatchPayload;
  @Input() currentUserId: string = '';
  @Input() isHost: boolean = false;
  
  @Output() drawCard = new EventEmitter<void>();
  @Output() endTurn = new EventEmitter<void>();
  @Output() kickPlayer = new EventEmitter<string>();

  get activePlayer() {
    return this.state.players[this.state.activePlayerIndex];
  }

  isMyTurn(): boolean {
    return this.activePlayer.id === this.currentUserId;
  }

  onDraw() {
    if (this.isMyTurn() && !this.state.hasDrawnThisTurn) {
      this.drawCard.emit();
    }
  }

  onEndTurn() {
    if (this.isMyTurn() && this.state.hasDrawnThisTurn) {
      this.endTurn.emit();
    }
  }
}
