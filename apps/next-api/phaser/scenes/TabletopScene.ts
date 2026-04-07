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
  private isReplaying: boolean = false;
  private replayQueue: any[] = [];

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
      if (!this.isReplaying) this.updateBoard(gameState);
    });

    this.game.events.on('PROCESS_REPLAY', ({ events, finalState }: any) => {
      this.playActionReplay(events, finalState);
    });

    this.game.events.on('UPDATE_TUTORIAL_STEP', (step: any) => {
      this.tutorialStep = step;
      if (!this.isReplaying) this.updateBoard(this.gameState!);
    });

    // --- REMOVED DRAG-TO-PLAY ---
  }

  private updateBoard(state: MatchPayload) {
    if (!state) return;
    const isNewDraw = !!(this.gameState && state.players.find(p => p.id === this.userId)?.hand.length! > this.gameState.players.find(p => p.id === this.userId)?.hand.length!);
    
    this.gameState = state;
    this.renderHand(isNewDraw);
    this.renderPlayPile();
    this.renderDecks();
    this.renderOpponents();
    this.renderPowerPile();
  }

  private async playActionReplay(events: any[], finalState: MatchPayload) {
      if (this.isReplaying) return;
      this.isReplaying = true;

      // Lock interaction
      this.input.enabled = false;

      for (const event of events) {
          const { action, actorId, card, cardName } = event;
          
          if (action === 'THINKING') {
              // Pulse the opponent HUD or just wait
              await this.sleep(600);
          } else if (action === 'DRAW') {
              // Animate a card from deck to the bot's position
              await this.animateBotDraw(actorId);
          } else if (action === 'PLAY') {
              // Animate card from bot to center
              if (card) {
                  await this.animateBotPlay(actorId, card);
              }
          } else if (action === 'END_TURN') {
              await this.sleep(400); // Brief pause
          }
      }

      this.isReplaying = false;
      this.input.enabled = true;
      this.updateBoard(finalState);
  }

  private animateBotDraw(actorId: string): Promise<void> {
      return new Promise(resolve => {
          const drawPile = this.decks.find(d => d.name === 'drawPile');
          if (!drawPile) return resolve();

          const temp = new CardBackSprite(this, drawPile.x, drawPile.y);
          temp.setScale(0.7);
          
          // Find target opponent position
          // This is a simplified "move to edge" for now
          this.tweens.add({
              targets: temp,
              x: this.cameras.main.width / 2,
              y: 50,
              alpha: 0,
              duration: 500,
              ease: 'Power2',
              onComplete: () => {
                  temp.destroy();
                  resolve();
              }
          });
      });
  }

  private animateBotPlay(actorId: string, card: any): Promise<void> {
      return new Promise(resolve => {
          const temp = new CardSprite(this, this.cameras.main.width / 2, 50, card);
          temp.setScale(0.5);
          temp.setAlpha(0);

          this.tweens.add({
              targets: temp,
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

  private sleep(ms: number) {
      return new Promise(resolve => this.time.delayedCall(ms, resolve));
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
        
        // --- TUTORIAL LOCKDOWN ---
        if (this.tutorialStep) {
            const isExpectedAction = this.tutorialStep.expectedActionType === 'PLAY_CARD';
            const isExpectedCard = this.tutorialStep.expectedCardId === card.id;
            
            if (isExpectedAction && isExpectedCard) {
                sprite.setLocked(false);
                sprite.setHighlighted(true);
            } else {
                sprite.setLocked(true);
                sprite.setHighlighted(false);
            }
        } else {
            // Standard state
            sprite.setLocked(false);
            sprite.setHighlighted(false);
        }

        // Click-to-Detail Interaction (No more dragging)
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

    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Draw Pile (Right Side of Center)
    const drawPile = this.add.container(centerX + 80, centerY);
    const count = this.gameState?.drawPile.length || 0;
    const isMyTurn = this.gameState?.players[this.gameState.activePlayerIndex].id === this.userId;
    
    if (count > 0) {
        // Visual stack
        for (let i = 0; i < Math.min(3, count); i++) {
            const back = new CardBackSprite(this, -i * 2, -i * 2);
            back.setScale(0.7);
            
            // TURN INDICATOR: Gray out if not my turn
            if (!isMyTurn) {
                back.setTint(0x777777);
            } else {
                back.clearTint();
            }
            
            drawPile.add(back);
        }
        
        // Interaction (Only on my turn and if I haven't drawn yet)
        if (isMyTurn && !this.gameState?.hasDrawnThisTurn) {
            // --- TUTORIAL LOCKDOWN ---
            const drawAllowed = this.tutorialStep ? this.tutorialStep.expectedActionType === 'DRAW_CARD' : true;

            drawPile.setSize(100, 150);
            drawPile.setInteractive({ useHandCursor: true });
            
            if (drawAllowed) {
                drawPile.on('pointerdown', () => {
                    if (this.onAction) this.onAction({ type: 'DRAW_CARD' });
                });
                // Hover effect
                drawPile.on('pointerover', () => { drawPile.setScale(1.05); });
                drawPile.on('pointerout', () => { drawPile.setScale(1); });
            } else {
                drawPile.setAlpha(0.3);
                // Child elements are already tinted in loop
            }
        }
    } else {
        // Empty frame
        const frame = this.add.graphics();
        frame.lineStyle(1, 0x333333, 1);
        frame.strokeRoundedRect(-49, -73, 98, 147, 8);
        drawPile.add(frame);
    }

    const countText = this.add.text(0, 110, `${count} CORE_UNITS`, {
        fontFamily: 'Inter',
        fontSize: '12px',
        fontStyle: '900',
        color: isMyTurn ? '#00ffcc' : '#777777'
    }).setOrigin(0.5);
    drawPile.add(countText);
    this.decks.push(drawPile);

    // 2. Discard Pile (Left Side of Center)
    const discardPile = this.add.container(centerX - 80, centerY);
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
    
    const opponentCount = others.length;
    const opponentSpacing = width / (opponentCount + 1);

    others.forEach((player, oppIndex) => {
        const startX = opponentSpacing * (oppIndex + 1);
        const startY = 80;
        const cardSpacing = 20;
        const totalW = (player.hand.length - 1) * cardSpacing;

        player.hand.forEach((card, i) => {
            const back = new CardBackSprite(this, startX - (totalW/2) + (i * cardSpacing), startY);
            back.setScale(0.3);
            back.setAngle(180);
            back.setDepth(i + 1);
            this.opponents.push(back);
        });

        const nameText = this.add.text(startX, startY + 50, player.displayName, { 
            fontFamily: 'Inter', 
            fontSize: '12px', 
            fontStyle: '900',
            color: '#ffffff' 
        }).setOrigin(0.5).setAlpha(0.8).setDepth(100);
        
        const healthText = this.add.text(startX, startY + 65, `${player.health}HP | ${player.survivalPoints} NRG`, {
            fontFamily: 'Inter',
            fontSize: '10px',
            color: '#00ffcc'
        }).setOrigin(0.5).setAlpha(0.6).setDepth(100);

        this.opponents.push(nameText);
        this.opponents.push(healthText);
    });
  }
}
