import Phaser from 'phaser';
import { CardSprite } from '../objects/CardSprite';
import { CardBackSprite } from '../objects/CardBackSprite';
import { MatchPayload, MatchCard } from '../../lib/tabletopShared';
import { loadLocalSettings } from '../../lib/localProfile';

export class TabletopScene extends Phaser.Scene {
  private hand: CardSprite[] = [];
  private playPile: CardSprite[] = [];
  private powerPile: CardSprite[] = [];
  private decks: Phaser.GameObjects.Container[] = [];
  private opponents: Phaser.GameObjects.GameObject[] = [];
  private gameState: MatchPayload | null = null;
  private onAction: ((action: any) => void) | null = null;
  private userId: string = '';

  constructor() {
    super('TabletopScene');
  }

  create() {
    this.userId = loadLocalSettings().userId;

    // 1. Check for persistent initial data from Phaser Registry
    const initialData = this.registry.get('INITIAL_DATA');
    if (initialData) {
      this.userId = initialData.userId || this.userId;
      this.onAction = initialData.onAction;
      this.updateBoard(initialData.gameState);
    }

    // 2. Listen for future events from PhaserGame React Component
    this.game.events.on('INIT_STATE', ({ gameState, onAction, userId }: any) => {
      this.onAction = onAction;
      if (userId) this.userId = userId;
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
        const height = this.cameras.main.height;
        if (gameObject.y < height * 0.6) {
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
    const isNewDraw = !!(this.gameState && state.players.find(p => p.id === this.userId)?.hand.length! > this.gameState.players.find(p => p.id === this.userId)?.hand.length!);
    
    this.gameState = state;
    this.renderHand(isNewDraw);
    this.renderPlayPile();
    this.renderDecks();
    this.renderOpponents();
    this.renderPowerPile();
  }

  private renderHand(animateNew: boolean = false) {
    const me = this.gameState?.players.find(p => p.id === this.userId);
    if (!me) return;

    // Clean up old sprites that are no longer in hand
    this.hand = this.hand.filter(sprite => {
        if (!me.hand.find(c => c.id === sprite.cardData.id)) {
            sprite.destroy();
            return false;
        }
        return true;
    });

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const startX = width / 2;
    const startY = height - 120;
    const spacing = 70;
    const totalWidth = (me.hand.length - 1) * spacing;

    me.hand.forEach((card, i) => {
       const targetX = startX - (totalWidth / 2) + (i * spacing);
       const targetAngle = (i - (me.hand.length - 1) / 2) * 5;
       const targetY = startY + Math.abs(i - (me.hand.length - 1) / 2) * 8;

       let sprite = this.hand.find(s => s.cardData.id === card.id);
       
       if (!sprite) {
          // New card (drawn)
          const spawnX = animateNew ? width - 120 : targetX;
          const spawnY = animateNew ? height / 2 : targetY;
          sprite = new CardSprite(this, spawnX, spawnY, card);
          this.hand.push(sprite);

          if (animateNew) {
            this.tweens.add({
                targets: sprite,
                x: targetX,
                y: targetY,
                angle: targetAngle,
                duration: 600,
                ease: 'Power2.easeOut'
            });
          }
       } else {
          // Existing card (re-position)
          this.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY,
            angle: targetAngle,
            duration: 300,
            ease: 'Power2.easeOut'
          });
       }

       sprite.setDepth(i + 100);
       
       // Drag and Drop (only if it's my turn)
       const isMyTurn = this.gameState?.players[this.gameState.activePlayerIndex].id === this.userId;
       if (isMyTurn) {
          this.input.setDraggable(sprite);
       } else {
          this.input.setDraggable(sprite, false);
       }
    });
  }

  private renderPlayPile() {
    const cards = this.gameState?.turnPile || [];
    this.playPile.forEach(c => c.destroy());
    this.playPile = [];

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 - 20;

    cards.forEach((card, i) => {
       const sprite = new CardSprite(this, centerX, centerY - 100, card);
       sprite.setScale(0.8);
       sprite.setAlpha(0);
       
       this.tweens.add({
         targets: sprite,
         y: centerY + (i * 2),
         x: centerX + (i * 2),
         alpha: 1,
         angle: (i - (cards.length - 1) / 2) * 5,
         duration: 400,
         ease: 'Back.easeOut'
       });

       sprite.setDepth(i + 50);
       this.playPile.push(sprite);
    });
  }

  private renderPowerPile() {
    const me = this.gameState?.players.find(p => p.id === this.userId);
    if (!me) return;

    this.powerPile.forEach(c => c.destroy());
    this.powerPile = [];

    const startX = 250;
    const startY = this.cameras.main.height - 120;
    const spacing = 30;

    me.powers.forEach((card, i) => {
       const sprite = new CardSprite(this, startX + (i * spacing), startY, card);
       sprite.setScale(0.5);
       sprite.setDepth(i + 10);
       this.powerPile.push(sprite);
    });
  }

  private renderDecks() {
    this.decks.forEach(d => d.destroy());
    this.decks = [];

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Draw Pile
    const drawPile = this.add.container(width - 150, height / 2);
    const count = this.gameState?.drawPile.length || 0;
    
    if (count > 0) {
        // Visual stack
        for (let i = 0; i < Math.min(3, count); i++) {
            const back = new CardBackSprite(this, -i * 2, -i * 2);
            back.setScale(0.7);
            drawPile.add(back);
        }
        
        // Interaction (Only on my turn and if I haven't drawn yet)
        const isMyTurn = this.gameState?.players[this.gameState.activePlayerIndex].id === this.userId;
        if (isMyTurn && !this.gameState?.hasDrawnThisTurn) {
            drawPile.setSize(100, 150);
            drawPile.setInteractive({ useHandCursor: true });
            drawPile.on('pointerdown', () => {
                if (this.onAction) this.onAction({ type: 'DRAW_CARD' });
            });
            
            // Hover effect
            drawPile.on('pointerover', () => { drawPile.setScale(1.05); });
            drawPile.on('pointerout', () => { drawPile.setScale(1); });
        }
    } else {
        // Empty frame
        const frame = this.add.graphics();
        frame.lineStyle(1, 0x333333, 1);
        frame.strokeRoundedRect(-49, -73, 98, 147, 8);
        drawPile.add(frame);
    }

    const countText = this.add.text(0, 110, `${count} DATA_UNITS`, {
        fontFamily: 'Inter',
        fontSize: '14px',
        fontStyle: '900',
        color: '#00ffcc'
    }).setOrigin(0.5);
    drawPile.add(countText);
    this.decks.push(drawPile);

    // 2. Discard Pile
    const discardPile = this.add.container(120, height / 2);
    const top = this.gameState?.discardPile[this.gameState.discardPile.length - 1];
    if (top) {
        const sprite = new CardSprite(this, 0, 0, top);
        sprite.setScale(0.7);
        discardPile.add(sprite);
    } else {
        discardPile.add(this.add.graphics().lineStyle(1, 0x333333).strokeRoundedRect(-49, -73, 98, 147, 8));
    }
    discardPile.add(this.add.text(0, 100, `DISCARD`, { fontFamily: 'Inter', fontSize: '10px', color: '#ff4444' }).setOrigin(0.5));
    this.decks.push(discardPile);
  }

  private renderOpponents() {
    this.opponents.forEach(o => o.destroy());
    this.opponents = [];
    if (!this.gameState) return;

    const others = this.gameState.players.filter(p => p.id !== this.userId);
    const width = this.cameras.main.width;
    
    others.forEach((player) => {
        const startX = width / 2;
        const startY = 80;
        const spacing = 30;
        const totalW = (player.hand.length - 1) * spacing;

        player.hand.forEach((card, i) => {
            const back = new CardBackSprite(this, startX - (totalW/2) + (i * spacing), startY);
            back.setScale(0.4);
            back.setAngle(180);
            this.opponents.push(back);
        });

        this.opponents.push(this.add.text(startX, startY + 60, player.displayName, { fontFamily: 'Spectral', fontSize: '10px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.6));
    });
  }
}
