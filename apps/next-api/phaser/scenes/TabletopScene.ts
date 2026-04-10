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
  private tutorialStep: any = null;
  private isAnimating: boolean = false;
  private processedRevision: number = -1;
  private opponentPos: Map<string, { x: number, y: number, angle?: number }> = new Map();

  constructor() {
    super('TabletopScene');
  }

  create() {
    this.userId = loadLocalSettings().userId;

    const initialData = this.registry.get('INITIAL_DATA');
    if (initialData) {
      this.userId = initialData.userId || this.userId;
      this.onAction = initialData.onAction;
      this.updateBoard(initialData.gameState);
    }

    this.game.events.on('INIT_STATE', ({ gameState, onAction, userId }: any) => {
      this.onAction = onAction;
      if (userId) this.userId = userId;
      this.updateBoard(gameState);
    });

    this.game.events.on('UPDATE_STATE', (gameState: MatchPayload) => {
      this.updateBoard(gameState);
    });

    this.game.events.on('SYNC_USER_ID', (userId: string) => {
      if (userId && this.userId !== userId) {
        this.userId = userId;
        if (this.gameState) {
            this.updateBoard(this.gameState);
        }
      }
    });

    this.game.events.on('UPDATE_TUTORIAL_STEP', (step: any) => {
      this.tutorialStep = step;
      if (this.gameState) this.updateBoard(this.gameState);
    });
  }

  private async updateBoard(state: MatchPayload) {
    if (!state) return;
    
    // DIFFING LOGIC for Real-Time Reactions
    if (this.gameState && state.revision !== this.processedRevision && !this.isAnimating) {
        this.isAnimating = true;
        try {
            const prev = this.gameState;
            const activeIdx = state.activePlayerIndex;
            const activePlayer = state.players[activeIdx];
            const prevActive = prev.players.find(p => p.id === activePlayer.id);

            // 1. Detect DRAW
            if (activePlayer.hand.length > (prevActive?.hand.length || 0)) {
                await this.animateDraw(activePlayer.id);
            }

            // 2. Detect PLAY
            if (state.topCard && (!prev.topCard || state.topCard.id !== prev.topCard.id)) {
                const wasJustDiscarded = state.discardPile.length > prev.discardPile.length && state.topCard?.id === state.discardPile[state.discardPile.length-1]?.id;
                if (!wasJustDiscarded && activePlayer.id !== this.userId) {
                    await this.animateBotPlay(activePlayer.id, state.topCard);
                }
            }

            // 3. Detect DISCARD
            if (state.discardPile.length > prev.discardPile.length && activePlayer.id !== this.userId) {
                const newDiscard = state.discardPile[state.discardPile.length - 1];
                await this.animateBotDiscard(activePlayer.id, newDiscard);
            }
        } finally {
            this.isAnimating = false;
        }
    }
    
    this.processedRevision = state.revision || -1;
    const isNewDraw = !!(this.gameState && state.players.find(p => p.id === this.userId)?.hand.length! > this.gameState.players.find(p => p.id === this.userId)?.hand.length!);
    
    this.gameState = state;
    this.renderAll();
  }

  private renderAll() {
    this.calculateSeatPositions();
    this.renderHand();
    this.renderPlayPile();
    this.renderDecks();
    this.renderOpponents();
    this.renderPowerPile();
  }

  private calculateSeatPositions() {
    if (!this.gameState) return;
    const players = this.gameState.players;
    const myIdx = players.findIndex(p => p.id === this.userId);
    const N = players.length;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Define 4 relative seats
    const seatCoordinates = [
        { x: width / 2, y: height - 120, angle: 0 },    // BOTTOM (Self)
        { x: 100, y: height / 2, angle: 90 },           // LEFT
        { x: width / 2, y: 100, angle: 180 },           // TOP
        { x: width - 100, y: height / 2, angle: -90 }   // RIGHT
    ];

    this.opponentPos.clear();
    players.forEach((p, i) => {
        // Relative seat mapping
        let seatIdx = (i - myIdx + N) % N;
        
        // Adjust mapping for 2 or 3 players to be more natural
        if (N === 2 && seatIdx === 1) seatIdx = 2; // Map 2nd player to TOP
        if (N === 3 && seatIdx === 1) seatIdx = 1; // 2nd to LEFT
        if (N === 3 && seatIdx === 2) seatIdx = 3; // 3rd to RIGHT

        this.opponentPos.set(p.id, seatCoordinates[seatIdx]);
    });
  }

  private animateDraw(actorId: string): Promise<void> {
      return new Promise(resolve => {
          const isMe = actorId === this.userId;
          const drawPile = this.decks.find(d => d.name === 'drawPile');
          if (!drawPile) return resolve();

          const temp = new CardBackSprite(this, drawPile.x, drawPile.y);
          temp.setScale(0.7);
          
          const pos = this.opponentPos.get(actorId);
          const targetX = pos?.x || this.cameras.main.width / 2;
          const targetY = pos?.y || 100;

          this.tweens.add({
              targets: temp,
              x: targetX,
              y: targetY,
              alpha: isMe ? 1 : 0.5, 
              scale: isMe ? 0.7 : 0.3,
              duration: 500,
              ease: 'Power2',
              onComplete: () => {
                  temp.destroy();
                  resolve();
              }
          });
      });
  }

  private animateBotDiscard(actorId: string, card: any): Promise<void> {
      return new Promise(resolve => {
          const pos = this.opponentPos.get(actorId);
          const startX = pos?.x || this.cameras.main.width / 2;
          const startY = pos?.y || 100;
          
          const centerX = this.cameras.main.width / 2;
          const centerY = this.cameras.main.height / 2;
          
          const temp = new CardSprite(this, startX, startY, card);
          temp.setScale(0.4);
          temp.setAlpha(0);

          this.tweens.add({
              targets: temp,
              x: centerX - 80,
              y: centerY,
              alpha: 1,
              scale: 0.7,
              duration: 600,
              ease: 'Power2.easeOut',
              onComplete: () => {
                  this.time.delayedCall(400, () => {
                      temp.destroy();
                      resolve();
                  });
              }
          });
      });
  }

  private animateBotPlay(actorId: string, card: any): Promise<void> {
      return new Promise(resolve => {
          const pos = this.opponentPos.get(actorId);
          const startX = pos?.x || this.cameras.main.width / 2;
          const startY = pos?.y || 100;

          const temp = new CardSprite(this, startX, startY, card);
          temp.setScale(0.4);
          temp.setAlpha(0);
          temp.setDepth(2000);

          this.tweens.add({
              targets: temp,
              x: this.cameras.main.width / 2,
              y: this.cameras.main.height / 2,
              alpha: 1,
              scale: 1,
              duration: 600,
              ease: 'Back.easeOut',
              onComplete: () => {
                  this.time.delayedCall(800, () => {
                      this.tweens.add({
                          targets: temp,
                          y: -200,
                          alpha: 0,
                          duration: 400,
                          onComplete: () => {
                              temp.destroy();
                              resolve();
                          }
                      });
                  });
              }
          });
      });
  }

  private getCardHandPos(index: number, total: number) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const startX = width / 2;
    const startY = height - 120;
    
    const baseSpacing = 70;
    const spacing = total > 5 ? (baseSpacing * 5) / total : baseSpacing;
    const totalWidth = (total - 1) * spacing;

    return {
       x: startX - (totalWidth / 2) + (index * spacing),
       y: startY + Math.abs(index - (total - 1) / 2) * 8,
       angle: (index - (total - 1) / 2) * 5
    };
  }

  private renderHand() {
    const me = this.gameState?.players.find(p => p.id === this.userId);
    if (!me) return;

    this.hand = this.hand.filter(sprite => {
        if (!me.hand.find(c => c.id === sprite.cardData.id)) {
            sprite.destroy();
            return false;
        }
        return true;
    });

    me.hand.forEach((card, i) => {
       const { x: targetX, y: targetY, angle: targetAngle } = this.getCardHandPos(i, me.hand.length);
       let sprite = this.hand.find(s => s.cardData.id === card.id);
       
       if (!sprite) {
          sprite = new CardSprite(this, targetX, targetY, card);
          sprite.setAlpha(0); 
          sprite.setAngle(targetAngle);
          this.hand.push(sprite);
          this.tweens.add({ targets: sprite, alpha: 1, duration: 300 });
       } else {
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
        sprite.setLocked(this.tutorialStep ? (this.tutorialStep.expectedCardId !== card.id) : false);
        sprite.setHighlighted(this.tutorialStep ? (this.tutorialStep.expectedCardId === card.id) : false);

        sprite.off('pointerdown');
        sprite.on('pointerdown', () => {
           this.game.events.emit('OPEN_CARD_DETAIL', card);
        });
     });
  }

  private renderPlayPile() {
    const cards = this.gameState?.turnPile || [];
    this.playPile.forEach(c => c.destroy());
    this.playPile = [];

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 - 20;

    cards.forEach((card, i) => {
       const sprite = new CardSprite(this, centerX, centerY, card);
       sprite.setScale(0.8);
       sprite.setAlpha(1);
       sprite.setAngle((i - (cards.length - 1) / 2) * 5);
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
    const centerX = width / 2;
    const centerY = height / 2;

    const drawPile = this.add.container(centerX + 80, centerY);
    drawPile.name = 'drawPile';
    
    const count = this.gameState?.drawPile.length || 0;
    const isMyTurn = this.gameState?.players[this.gameState.activePlayerIndex].id === this.userId;
    
    if (count > 0) {
        for (let i = 0; i < Math.min(3, count); i++) {
            const back = new CardBackSprite(this, -i * 2, -i * 2);
            back.setScale(0.7);
            if (!isMyTurn) back.setTint(0x777777);
            drawPile.add(back);
        }
        
        if (isMyTurn && !this.gameState?.hasDrawnThisTurn) {
            drawPile.setSize(100, 150);
            drawPile.setInteractive({ useHandCursor: true });
            drawPile.on('pointerdown', () => {
                if (this.onAction) this.onAction({ type: 'DRAW_CARD' });
            });
            drawPile.on('pointerover', () => { drawPile.setScale(1.05); });
            drawPile.on('pointerout', () => { drawPile.setScale(1); });
        }
    }

    const countText = this.add.text(0, 110, `${count} CORE_UNITS`, {
        fontFamily: 'Inter', fontSize: '12px', fontStyle: '900', color: isMyTurn ? '#f59e0b' : '#777777'
    }).setOrigin(0.5);
    drawPile.add(countText);
    this.decks.push(drawPile);

    const discardPile = this.add.container(centerX - 80, centerY);
    const top = this.gameState?.discardPile[this.gameState.discardPile.length - 1];
    if (top) {
        const sprite = new CardSprite(this, 0, 0, top);
        sprite.setScale(0.7);
        discardPile.add(sprite);
    }
    discardPile.add(this.add.text(0, 100, `DISCARD`, { fontFamily: 'Inter', fontSize: '10px', color: '#ff4444' }).setOrigin(0.5));
    this.decks.push(discardPile);
  }

  private renderOpponents() {
    this.opponents.forEach(o => o.destroy());
    this.opponents = [];
    if (!this.gameState) return;

    const others = this.gameState.players.filter(p => p.id !== this.userId);
    others.forEach((player) => {
        const pos = this.opponentPos.get(player.id);
        if (!pos) return;

        const startX = pos.x;
        const startY = pos.y;
        const angle = pos.angle || 0;
        
        const cardSpacing = 15;
        const totalW = (player.hand.length - 1) * cardSpacing;

        player.hand.forEach((_, i) => {
            let cx = startX;
            let cy = startY;
            
            // Adjust fan direction based on seat
            if (angle === 90 || angle === -90) { // LEFT/RIGHT
                cy = startY - (totalW/2) + (i * cardSpacing);
            } else { // TOP
                cx = startX - (totalW/2) + (i * cardSpacing);
            }

            const back = new CardBackSprite(this, cx, cy);
            back.setScale(0.25);
            back.setAngle(angle + 180);
            back.setDepth(i + 1);
            this.opponents.push(back);
        });

        const nameText = this.add.text(startX, startY + (angle === 180 ? -60 : 60), player.displayName, { 
            fontFamily: 'Inter', fontSize: '10px', fontStyle: '900', color: '#ffffff' 
        }).setOrigin(0.5).setAlpha(0.6).setDepth(100);
        this.opponents.push(nameText);
    });
  }
}
