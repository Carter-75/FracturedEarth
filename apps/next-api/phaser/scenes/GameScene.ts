import Phaser from 'phaser';
import { cardTheme, describeCardEffect } from '../../lib/tabletopShared';
import { THEMES, Theme } from '../../lib/themeConfig';

export class GameScene extends Phaser.Scene {
  private gameState: any;
  private currentTheme!: Theme;
  private playerHand: Phaser.GameObjects.Container[] = [];
  private botHand: Phaser.GameObjects.Container[] = [];
  private drawDeck!: Phaser.GameObjects.Container;
  private discardPile!: Phaser.GameObjects.Container;
  private playZone!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Container;
  
  // State tracking for animations
  private isAnimatingReplay: boolean = false;
  private activePlayerId!: string;
  private onAction!: (action: any) => void;

  constructor() {
    super('GameScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
    
    this.gameState = this.registry.get('gameState');
    this.onAction = this.registry.get('onAction');
    this.activePlayerId = this.registry.get('userId') || 'local-user';
  }

  create() {
    const { width, height } = this.scale;

    // --- Background Layer ---
    this.setupBackground();

    // --- Table Layout ---
    this.setupTable();

    // --- HUD Layer ---
    this.setupHUD();

    // --- Event Listeners ---
    this.game.events.on('state-changed', (newState: any) => {
      this.handleStateChange(newState);
    });

    this.game.events.on('theme-changed', (newName: string) => {
        const found = THEMES.find(t => t.name === newName);
        if (found) {
            this.currentTheme = found;
            if (this.scene.isActive()) this.scene.restart();
        }
    });

    // Initial render
    this.updateBoard(true);
  }

  private setupBackground() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;
    
    // Base themed background
    this.add.image(width / 2, height / 2, 'bg_survival')
      .setDisplaySize(width, height)
      .setAlpha(0.2)
      .setTint(theme.bgTint);

    // Decorative grid
    const grid = this.add.graphics();
    grid.lineStyle(1, theme.primary, 0.05);
    for (let i = 0; i < width; i += 60) {
      grid.moveTo(i, 0); grid.lineTo(i, height);
    }
    for (let j = 0; j < height; j += 60) {
      grid.moveTo(0, j); grid.lineTo(width, j);
    }
    grid.strokePath();
  }

  private setupTable() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    this.drawDeck = this.add.container(width * 0.15, height * 0.5);
    this.discardPile = this.add.container(width * 0.85, height * 0.5);
    this.playZone = this.add.container(width / 2, height * 0.4);

    // Interaction Labels
    const labelStyle = { 
        fontFamily: theme.fontPrimary, 
        fontSize: '10px', 
        color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, 
        alpha: 0.3 
    };
    this.add.text(width * 0.15, height * 0.5 + 130, 'SECTOR_DRAW_STACK', labelStyle).setOrigin(0.5);
    this.add.text(width * 0.85, height * 0.5 + 130, 'RECALL_BUFFER', labelStyle).setOrigin(0.5);
  }

  private setupHUD() {
    this.hud = this.add.container(0, 0);
  }

  private handleStateChange(newState: any) {
    if (this.isAnimatingReplay) return;
    if (newState.botTurnReplay && newState.botTurnReplay.length > 0) {
      this.playBotReplay(newState);
    } else {
      this.gameState = newState;
      this.updateBoard();
    }
  }

  private async playBotReplay(newState: any) {
    this.isAnimatingReplay = true;
    const replay = newState.botTurnReplay;
    this.gameState = { ...newState, botTurnReplay: [] }; 

    for (const event of replay) {
      await this.animateBotEvent(event);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    this.isAnimatingReplay = false;
    this.gameState = newState;
    this.updateBoard();
  }

  private async animateBotEvent(event: any) {
    const { width, height } = this.scale;
    if (event.action === 'THINKING') return; 

    if (event.action === 'DRAW') {
      const card = this.add.image(this.drawDeck.x, this.drawDeck.y, 'card_back')
        .setDisplaySize(100, 140).setDepth(1000);
      
      return new Promise<void>(resolve => {
        this.tweens.add({
          targets: card, x: width / 2, y: height * 0.1, alpha: 0, scale: 0.5,
          duration: 600, ease: 'Power2', onComplete: () => { card.destroy(); resolve(); }
        });
      });
    }

    if (event.action === 'PLAY') {
      const cardObj = this.createCardObject(width / 2, height * 0.1, event.card);
      cardObj.setDepth(1000);
      
      return new Promise<void>(resolve => {
        this.tweens.add({
          targets: cardObj, y: height * 0.4, scale: 1, duration: 800, ease: 'Cubic.out',
          onComplete: () => {
            this.cameras.main.shake(100, 0.002);
            this.emitImpactEffect(cardObj.x, cardObj.y);
            resolve();
          }
        });
      });
    }
  }

  private updateBoard(immediate = false) {
    if (!this.gameState) return;
    this.updateHUD();
    this.updateHand();
    this.updateBotHand();
    this.updatePiles(immediate);
  }

  private updateHUD() {
    const { width, height } = this.scale;
    this.hud.removeAll(true);

    const players = this.gameState.players;
    const activeIdx = this.gameState.activePlayerIndex;

    players.forEach((p: any, i: number) => {
      const isActive = i === activeIdx;
      const isMe = p.id === this.activePlayerId;
      const panel = isMe ? this.createPlayerStats(width * 0.05, height * 0.82, p, isActive) 
                         : this.createOpponentStats(width / 2, height * 0.08, p, isActive);
      this.hud.add(panel);
    });
  }

  private createPlayerStats(x: number, y: number, player: any, isActive: boolean) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 320, 100, 0x000000, 0.6)
      .setStrokeStyle(2, isActive ? theme.primary : theme.secondary).setOrigin(0);
    
    const name = this.add.text(20, 15, player.displayName.toUpperCase(), {
      fontFamily: theme.fontPrimary, fontSize: '18px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(isActive ? theme.primary : 0xffffff).rgba
    });
    
    // HP Bar
    const hpProgress = this.add.graphics();
    hpProgress.fillStyle(0x333333, 1);
    hpProgress.fillRect(50, 48, 200, 6);
    hpProgress.fillStyle(0xef4444, 1); // Stay red for health
    hpProgress.fillRect(50, 48, 200 * (player.health / 20), 6);

    // Points Bar (Themed)
    const ptsProgress = this.add.graphics();
    ptsProgress.fillStyle(0x333333, 1);
    ptsProgress.fillRect(50, 68, 200, 6);
    ptsProgress.fillStyle(theme.primary, 1);
    ptsProgress.fillRect(50, 68, 200 * (player.survivalPoints / 100), 6);

    container.add([bg, name, hpProgress, ptsProgress]);
    return container;
  }

  private createOpponentStats(x: number, y: number, player: any, isActive: boolean) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 240, 60, 0x000000, 0.4)
      .setStrokeStyle(1, isActive ? theme.accent : theme.secondary).setOrigin(0.5);
    
    const name = this.add.text(0, -15, player.displayName, {
      fontFamily: theme.fontPrimary, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);

    const statsColors = Phaser.Display.Color.IntegerToColor(isActive ? theme.accent : theme.primary).rgba;
    const stats = this.add.text(0, 10, `HP: ${player.health}  |  PTS: ${player.survivalPoints}`, {
      fontFamily: theme.fontPrimary, fontSize: '12px', color: statsColors
    }).setOrigin(0.5);

    container.add([bg, name, stats]);
    return container;
  }

  private updateHand() {
    const { width, height } = this.scale;
    const me = this.gameState.players.find((p: any) => p.id === this.activePlayerId);
    if (!me) return;

    this.playerHand.forEach(c => c.destroy());
    this.playerHand = [];

    const handSize = me.hand.length;
    const spacing = Math.min(100, 600 / handSize);
    const startX = width / 2 - (spacing * (handSize - 1)) / 2;

    me.hand.forEach((cardData: any, i: number) => {
      const angle = (i - (handSize - 1) / 2) * (20 / Math.max(1, handSize));
      const x = startX + i * spacing;
      const y = height * 0.9 + Math.abs(angle) * 10;

      const card = this.createCardObject(x, y, cardData);
      card.setRotation(Phaser.Math.DegToRad(angle));
      card.setDepth(i);

      const interactiveZone = card.getAt(0) as Phaser.GameObjects.Image;
      interactiveZone.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          this.tweens.add({ targets: card, y: height * 0.8, scale: 1.2, rotation: 0, duration: 200, ease: 'Back.out' });
          card.setDepth(1000);
        })
        .on('pointerout', () => {
          this.tweens.add({ targets: card, y: y, scale: 1, rotation: Phaser.Math.DegToRad(angle), duration: 200, ease: 'Power2' });
          card.setDepth(i);
        })
        .on('pointerdown', () => this.handleCardPlay(card, cardData));

      this.playerHand.push(card);
    });
  }

  private updateBotHand() {
    const { width, height } = this.scale;
    const bot = this.gameState.players.find((p: any) => p.id !== this.activePlayerId);
    if (!bot) return;

    this.botHand.forEach(c => c.destroy());
    this.botHand = [];

    const count = bot.hand.length;
    const spacing = 40;
    const startX = width / 2 - (spacing * (count - 1)) / 2;

    for (let i = 0; i < count; i++) {
        const card = this.add.container(startX + i * spacing, height * -0.05);
        const back = this.add.image(0, 0, 'card_back').setDisplaySize(80, 110);
        card.add(back);
        card.setDepth(10);
        card.setRotation(Math.PI); 
        this.botHand.push(card);
    }
  }

  private updatePiles(immediate = false) {
    const theme = this.currentTheme;
    const { drawPile, discardPile, turnPile } = this.gameState;

    this.drawDeck.removeAll(true);
    const drawCount = Math.min(5, Math.ceil(drawPile.length / 5));
    for (let i = 0; i < drawCount; i++) {
      const layer = this.add.image(i * 2, -i * 2, 'card_back').setDisplaySize(140, 200).setTint(0x444444);
      if (i === drawCount - 1) {
          layer.setTint(0xffffff).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.onAction({ type: 'DRAW_CARD' }));
      }
      this.drawDeck.add(layer);
    }

    this.discardPile.removeAll(true);
    const discardCount = Math.min(5, Math.ceil(discardPile.length / 5));
    for (let i = 0; i < discardCount; i++) {
        const layer = this.add.rectangle(i * 2, -i * 2, 140, 200, 0x111111).setStrokeStyle(1, theme.primary, 0.3);
        this.discardPile.add(layer);
    }
    if (this.gameState.topCard) {
        const top = this.createCardObject(discardCount * 2, -discardCount * 2, this.gameState.topCard);
        top.setAlpha(0.6).setScale(0.9);
        this.discardPile.add(top);
    }

    this.playZone.removeAll(true);
    turnPile.forEach((c: any, idx: number) => {
        const offsetX = (idx - (turnPile.length - 1) / 2) * 50;
        const card = this.createCardObject(offsetX, 0, c);
        card.setRotation(Phaser.Math.DegToRad((idx - (turnPile.length - 1) / 2) * 8));
        this.playZone.add(card);
    });
  }

  private createCardObject(x: number, y: number, cardData: any) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bgArt = this.add.image(0, 0, `bg_${cardData.type.toLowerCase()}`).setDisplaySize(130, 190).setAlpha(0.7);
    const frame = this.add.image(0, 0, 'card_frame').setDisplaySize(140, 200);
    const artwork = this.add.rectangle(0, -20, 110, 80, 0x000000, 0.4);
    const name = this.add.text(0, -80, cardData.name.toUpperCase(), {
      fontFamily: theme.fontPrimary, fontSize: '10px', fontStyle: 'bold', color: '#ffffff',
      align: 'center', wordWrap: { width: 110 }
    }).setOrigin(0.5);

    const typeTxt = this.add.text(0, 85, cardData.type, {
      fontFamily: theme.fontPrimary, fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
    }).setOrigin(0.5).setAlpha(0.8);

    container.add([bgArt, frame, artwork, name, typeTxt]);
    return container;
  }

  private handleCardPlay(cardObj: Phaser.GameObjects.Container, cardData: any) {
    const { width, height } = this.scale;
    this.tweens.add({
      targets: cardObj, x: width / 2, y: height * 0.4, rotation: 0, scale: 1, duration: 600, ease: 'Cubic.out',
      onComplete: () => {
        this.emitImpactEffect(width / 2, height * 0.4);
        this.onAction({ type: 'PLAY_CARD', cardId: cardData.id });
      }
    });
  }

  private emitImpactEffect(x: number, y: number) {
    const theme = this.currentTheme;
    this.add.particles(x, y, 'particle_glow', {
        speed: { min: 200, max: 400 }, scale: { start: 0.4, end: 0 }, alpha: { start: 1, end: 0 },
        lifespan: 800, tint: theme.particle, blendMode: 'ADD', stopAfter: 30
    });
    
    const flash = this.add.circle(x, y, 100, theme.primary, 0.5);
    this.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  }
}
