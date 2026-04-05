import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';
import { CinematicOverlay } from '../utils/CinematicOverlay';

export class HomeScene extends Phaser.Scene {
  private currentTheme!: Theme;
  private overlay?: CinematicOverlay;

  constructor() {
    super('HomeScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Cinematic Overlay (Stack: BG Art -> Scanlines -> Noise -> Vignette)
    this.overlay = new CinematicOverlay(this, theme);

    // Title Section
    const titleTop = this.add.text(width / 2, height * 0.35, 'FRACTURED', {
      fontFamily: theme.fontPrimary, fontSize: '42px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba, letterSpacing: 20
    }).setOrigin(0.5).setAlpha(0.2);

    const titleMain = this.add.text(width / 2, height * 0.42, 'EARTH', {
      fontFamily: theme.fontPrimary, fontSize: '130px', fontStyle: 'bold italic', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
    }).setOrigin(0.5);

    // Ambient Particles (Refined to use Theme primary)
    this.add.particles(0, 0, 'particle_glow', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        speed: { min: 10, max: 30 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 5000,
        tint: theme.primary,
        frequency: 50,
        blendMode: 'ADD'
    });

    // --- Main Menu Buttons ---
    const menuY = height * 0.65;
    const spacing = 70;

    const buttons = [
      { text: 'START_MATCH_LINK', scene: 'GameScene' },
      { text: 'SECTOR_TRAINING', scene: 'TutorialScene' },
      { text: 'NEURAL_SETTINGS', scene: 'SettingsScene' },
      { text: 'TERMINATE_LINK', scene: 'Exit' }
    ];

    buttons.forEach((btn, i) => {
        this.createMenuButton(width / 2, menuY + i * spacing, btn.text, () => {
            if (btn.scene === 'Exit') {
                // Exit logic
            } else {
                this.scene.start(btn.scene);
            }
        });
    });

    // Version Footer
    this.add.text(width - 20, height - 20, 'FE_OS_v2.5.0', {
      fontFamily: theme.fontPrimary, fontSize: '10px', color: '#ffffff'
    }).setOrigin(1, 1).setAlpha(0.3);

    // Registry Listener for Theme Changes
    const onThemeChange = (newName: string) => {
        if (this.scene.isActive()) this.scene.restart();
    };
    this.game.events.on('theme-changed', onThemeChange);
    this.events.once('shutdown', () => {
        this.game.events.off('theme-changed', onThemeChange);
    });
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 450, 50, 0x000000, 0.4)
        .setStrokeStyle(1, theme.primary, 0.3);
    
    const txt = this.add.text(0, 0, text, {
        fontFamily: theme.fontPrimary, fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, letterSpacing: 4
    }).setOrigin(0.5);

    container.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setStrokeStyle(2, theme.accent, 1);
        bg.setFillStyle(theme.primary, 0.1);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.accent).rgba);
        this.tweens.add({ targets: container, x: x + 20, duration: 200, ease: 'Power2' });
      })
      .on('pointerout', () => {
        bg.setStrokeStyle(1, theme.primary, 0.3);
        bg.setFillStyle(0x000000, 0.4);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.primary).rgba);
        this.tweens.add({ targets: container, x: x, duration: 200, ease: 'Power2' });
      })
      .on('pointerdown', callback);

    return container;
  }
}
