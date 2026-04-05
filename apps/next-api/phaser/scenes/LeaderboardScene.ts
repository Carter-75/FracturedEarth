import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';
import { CinematicOverlay } from '../utils/CinematicOverlay';

export class LeaderboardScene extends Phaser.Scene {
  private currentTheme!: Theme;
  private overlay?: CinematicOverlay;

  constructor() {
    super('LeaderboardScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Cinematic Overlay
    this.overlay = new CinematicOverlay(this, theme);

    // Title
    this.add.text(width / 2, height * 0.1, 'SECTOR_DOMINANCE_INDEX', {
      fontFamily: theme.fontPrimary, fontSize: '32px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba, letterSpacing: 8
    }).setOrigin(0.5);

    // Table Header
    const headerY = height * 0.22;
    this.add.text(width * 0.3, headerY, 'SURVIVOR_ID', { fontFamily: theme.fontPrimary, fontSize: '14px', color: '#ffffff' }).setAlpha(0.5);
    this.add.text(width * 0.7, headerY, 'INDEX', { fontFamily: theme.fontPrimary, fontSize: '14px', color: '#ffffff' }).setAlpha(0.5);

    // Placeholder entries
    const players = [
      { name: 'X_AE_A-12', score: 9850 },
      { name: 'NEURAL_LINK_01', score: 8720 },
      { name: 'CYBER_PUNK_77', score: 7410 },
      { name: 'VOID_WALKER', score: 6200 },
      { name: 'GHOST_IN_SHELL', score: 5150 }
    ];

    players.forEach((p, i) => {
        const y = height * 0.3 + i * 60;
        this.add.rectangle(width / 2, y, width * 0.6, 50, 0x000000, 0.5).setStrokeStyle(1, theme.primary, 0.1);
        this.add.text(width * 0.3, y, p.name, { fontFamily: theme.fontPrimary, fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5);
        this.add.text(width * 0.7, y, p.score.toString(), { fontFamily: theme.fontPrimary, fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    // Back Button
    this.createButton(width / 2, height * 0.88, 'RESET_NEURAL_LINK', () => this.scene.start('HomeScene'));

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
