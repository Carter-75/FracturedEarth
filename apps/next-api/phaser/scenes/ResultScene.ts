import Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class ResultScene extends Phaser.Scene {
  private currentTheme!: Theme;

  constructor() {
    super('ResultScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create(data: { isWinner: boolean, score?: number }) {
    const { width, height } = this.scale;
    const isWinner = data.isWinner;
    const theme = this.currentTheme;

    // Background overlay
    this.add.rectangle(width / 2, height / 2, width, height, theme.bgTint, 0.85);

    // Title Transition
    const title = isWinner ? 'ASCENSION_COMPLETE' : 'SECTOR_COLLAPSE';
    const color = isWinner ? 0x10b981 : 0xef4444;

    const titleText = this.add.text(width / 2, height * 0.4, title, {
      fontFamily: theme.fontPrimary, fontSize: '80px', fontStyle: 'bold italic', color: '#ffffff'
    }).setOrigin(0.5).setScale(2);

    this.tweens.add({
      targets: titleText,
      scale: 1,
      duration: 1000,
      ease: 'Expo.out'
    });

    // Particle Burst
    this.add.particles(width / 2, height * 0.4, 'particle_glow', {
        speed: { min: 100, max: 600 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1500,
        tint: color,
        blendMode: 'ADD',
        stopAfter: 100
    });

    // Subtitle
    const sub = isWinner ? 'Neural link stabilized. Sector dominance secured.' : 'Neural link severed. Re-initialization required.';
    this.add.text(width / 2, height * 0.52, sub, {
      fontFamily: theme.fontPrimary, fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.6);

    // Stats
    if (data.score !== undefined) {
        this.add.text(width / 2, height * 0.6, `FINAL_SURVIVAL_INDEX: ${data.score}`, {
            fontFamily: theme.fontPrimary, fontSize: '24px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
        }).setOrigin(0.5);
    }

    // Return Button
    this.createButton(width / 2, height * 0.75, 'RE-INITIALIZE_LOBBY', () => this.scene.start('HomeScene'));

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
    const bg = this.add.rectangle(0, 0, 400, 60, 0x000000, 0.5).setStrokeStyle(2, theme.primary, 0.2);
    const txt = this.add.text(0, 0, text, {
      fontFamily: theme.fontPrimary, fontSize: '20px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
    }).setOrigin(0.5);
    container.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setStrokeStyle(2, theme.accent, 1);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.accent).rgba);
        this.tweens.add({ targets: container, scale: 1.1, duration: 200 });
      })
      .on('pointerout', () => {
        bg.setStrokeStyle(2, theme.primary, 0.2);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.primary).rgba);
        this.tweens.add({ targets: container, scale: 1, duration: 200 });
      })
      .on('pointerdown', callback);

    return container;
  }
}
