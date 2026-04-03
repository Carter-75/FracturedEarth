import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchCard } from '@match-engine';
import { GameCardComponent } from '../game-card/game-card.component';

@Component({
  selector: 'app-player-hand',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.scss']
})
export class PlayerHandComponent {
  @Input() hand: MatchCard[] = [];
  @Input() active: boolean = false;
  @Input() selectionDisabled: boolean = false;
  
  @Output() selectCard = new EventEmitter<MatchCard>();

  onCardClicked(card: MatchCard) {
    this.selectCard.emit(card);
  }
}
