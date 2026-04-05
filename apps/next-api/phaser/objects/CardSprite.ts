import Phaser from 'phaser';
import { MatchCard, cardTheme } from '../../lib/tabletopShared';

export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: MatchCard;
  private background: Phaser.GameObjects.Image;
  private frame: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private typeText: Phaser.GameObjects.Text;
  private pointsText: Phaser.GameObjects.Text;
  private iconText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, card: MatchCard) {
    super(scene, x, y);
    this.cardData = card;

    const theme = cardTheme(card.type);
    const width = 140;
    const height = 210;

    // 1. Background Image (Preloaded in PreloadScene)
    const assetKey = `bg-${card.type.toLowerCase()}`;
    this.background = scene.add.image(0, 0, assetKey);
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.6);
    this.add(this.background);

    // 2. Gradient Overlay (Approximated with Graphics)
    const overlay = scene.add.graphics();
    overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
    overlay.fillRect(-width/2, -height/2, width, height);
    this.add(overlay);

    // 3. Border Frame
    this.frame = scene.add.graphics();
    const borderColor = parseInt(theme.glow.replace('rgba(', '').split(',')[0] === 'var' ? '0x00ffcc' : '0xffffff', 16); 
    // Fallback logic for colors in Phaser
    const hexColor = this.getThemeHex(card.type);
    this.frame.lineStyle(2, hexColor, 0.3);
    this.frame.strokeRoundedRect(-width/2, -height/2, width, height, 12);
    this.add(this.frame);

    // 4. Icon
    this.iconText = scene.add.text(-width/2 + 15, -height/2 + 15, theme.icon, {
      fontSize: '24px'
    }).setOrigin(0);
    this.add(this.iconText);

    // 5. Type Badge
    this.typeText = scene.add.text(width/2 - 15, -height/2 + 15, card.type, {
      fontSize: '10px',
      fontFamily: 'Inter',
      fontWeight: '900',
      color: '#ffffff'
    }).setOrigin(1, 0).setAlpha(0.6);
    this.add(this.typeText);

    // 6. Name
    this.nameText = scene.add.text(0, 0, card.name.toUpperCase(), {
      fontSize: '16px',
      fontFamily: 'Spectral',
      fontStyle: 'italic bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5);
    this.nameText.setY(-10);
    this.add(this.nameText);

    // 7. Efficiency Stats
    this.pointsText = scene.add.text(-width/2 + 15, height/2 - 15, `+${card.pointsDelta ?? 0}`, {
      fontSize: '14px',
      fontFamily: 'Inter',
      fontWeight: '900',
      color: '#ffffff'
    }).setOrigin(0, 1);
    this.add(this.pointsText);

    // Setup Interaction
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    
    // Default Scale
    this.setScale(1);

    scene.add.existing(this);
  }

  private getThemeHex(type: string): number {
    switch(type) {
      case 'SURVIVAL': return 0x10b981;
      case 'DISASTER': return 0xf43f5e;
      case 'CHAOS': return 0xf59e0b;
      case 'ADAPT': return 0xa855f7;
      case 'POWER': return 0x3b82f6;
      default: return 0xffffff;
    }
  }

  public setSelected(selected: boolean) {
     if (selected) {
        this.setScale(1.1);
        this.frame.lineStyle(4, 0x00ffcc, 1);
     } else {
        this.setScale(1);
        const hexColor = this.getThemeHex(this.cardData.type);
        this.frame.lineStyle(2, hexColor, 0.3);
     }
  }
}
