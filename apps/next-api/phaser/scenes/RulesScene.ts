import Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class RulesScene extends Phaser.Scene {
  private currentTheme!: Theme;

  constructor() {
    super('RulesScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Background
    this.add.image(width / 2, height / 2, 'bg_adapt').setDisplaySize(width, height).setAlpha(0.1).setTint(theme.bgTint);

    // Title
    this.add.text(width / 2, height * 0.1, 'SECTOR_NEURAL_ATLAS', {
      fontFamily: theme.fontPrimary, fontSize: '32px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba, letterSpacing: 8
    }).setOrigin(0.5);

    // Rules Panel
    const panel = this.add.container(width / 2, height / 2);
    const bg = this.add.rectangle(0, 0, 900, 500, 0x000000, 0.7).setStrokeStyle(1, theme.primary, 0.2);
    
    const rules = [
      '1. DRAW Phase: Mandatory link established per turn.',
      '2. DEPLOY Phase: Play 1-3 cards from hand.',
      '3. SURVIVAL Points: Accumulate 100 to dominate the sector.',
      '4. HEALTH depletion: Reaching 0 initiates link severance (Defeat).',
      '5. DISASTERS: High-threat events targeting specific player zones.',
      '6. CATACLYSMS: Sector-wide disasters affecting all survival links.',
      '7. TWIST CARDS: Immediate reality shifts drawn from the deck.',
      '8. POWERS & ADAPTATIONS: Permanent field upgrades.'
    ];

    rules.forEach((r, i) => {
        const txt = this.add.text(-400, -200 + i * 50, r, {
            fontFamily: theme.fontPrimary, fontSize: '18px', color: '#ffffff'
        });
        panel.add(txt);
    });

    panel.add(bg);
    bg.sendToBack();

    // Back Button
    this.createButton(width / 2, height * 0.88, 'ACKNOWLEDGE_PROTOCOL', () => this.scene.start('HomeScene'));

    // Registry Listener for Theme Changes
    this.game.events.on('theme-changed', (newName: string) => {
        const found = THEMES.find(t => t.name === newName);
        if (found) {
            this.currentTheme = found;
            if (this.scene.isActive()) this.scene.restart();
        }
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 320, 50, 0x000000, 0.8).setStrokeStyle(1, theme.primary, 0.5);
    const txt = this.add.text(0, 0, text, {
      fontFamily: theme.fontPrimary, fontSize: '14px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
    }).setOrigin(0.5);
    container.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setStrokeStyle(2, theme.accent, 1);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.accent).rgba);
      })
      .on('pointerout', () => {
        bg.setStrokeStyle(1, theme.primary, 0.5);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.primary).rgba);
      })
      .on('pointerdown', callback);

    return container;
  }
}
