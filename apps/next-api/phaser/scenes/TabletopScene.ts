import Phaser from 'phaser';
import { CardSprite } from '../objects/CardSprite';
import { MatchPayload, MatchCard } from '../../lib/tabletopShared';
import { loadLocalSettings } from '../../lib/localProfile';

export class TabletopScene extends Phaser.Scene {
  private hand: CardSprite[] = [];
  private playPile: CardSprite[] = [];
  private gameState: MatchPayload | null = null;
  private onAction: ((action: any) => void) | null = null;
  private userId: string = '';

  constructor() {
    super('TabletopScene');
  }

  create() {
    this.userId = loadLocalSettings().userId;

    // Listen for events from PhaserGame React Component
    this.game.events.on('INIT_STATE', ({ gameState, onAction }: any) => {
      this.onAction = onAction;
      this.updateBoard(gameState);
    });

    this.game.events.on('UPDATE_STATE', (gameState: MatchPayload) => {
      this.updateBoard(gameState);
    });

    // Handle Drag Events
    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: CardSprite, dragX: number, dragY: number) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject.setAngle(0); // Flatten while dragging
    });

    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: CardSprite) => {
        if (gameObject.y < this.cameras.main.height * 0.6) {
           // PLAY CARD
           if (this.onAction) {
              this.onAction({ 
                 type: 'PLAY_CARD', 
                 cardId: gameObject.cardData.id 
              });
           }
        }
        this.renderHand(); // Snap back if not played
    });
  }

  private updateBoard(state: MatchPayload) {
    this.gameState = state;
    this.renderHand();
    this.renderPlayPile();
  }

  private renderHand() {
    const me = this.gameState?.players.find(p => p.id === this.userId);
    if (!me) return;

    // Remove old hand
    this.hand.forEach(c => c.destroy());
    this.hand = [];

    const startX = this.cameras.main.width / 2;
    const startY = this.cameras.main.height - 120;
    const spacing = 70;
    const totalWidth = (me.hand.length - 1) * spacing;

    me.hand.forEach((card, i) => {
       const x = startX - (totalWidth / 2) + (i * spacing);
       const angle = (i - (me.hand.length - 1) / 2) * 5;
       const y = startY + Math.abs(i - (me.hand.length - 1) / 2) * 8;

       const sprite = new CardSprite(this, x, y, card);
       sprite.setAngle(angle);
       sprite.setDepth(i + 100);
       
       // Drag and Drop (only if it's my turn)
       const isMyTurn = this.gameState?.players[this.gameState.activePlayerIndex].id === this.userId;
       if (isMyTurn && this.gameState?.cardsPlayedThisTurn === 0) {
          this.input.setDraggable(sprite);
       }

       this.hand.push(sprite);
    });
  }

  private renderPlayPile() {
    const cards = this.gameState?.turnPile || [];
    
    // Remove old play pile
    this.playPile.forEach(c => c.destroy());
    this.playPile = [];

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    cards.forEach((card, i) => {
       const x = centerX + (i * 2);
       const y = centerY + (i * 2);
       const angle = (i - (cards.length - 1) / 2) * 5;

       const sprite = new CardSprite(this, x, y, card);
       sprite.setAngle(angle);
       sprite.setScale(0.8);
       sprite.setDepth(i);
       this.playPile.push(sprite);
    });
  }
}
