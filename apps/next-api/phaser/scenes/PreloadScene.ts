import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class PreloadScene extends Phaser.Scene {
  private currentTheme!: Theme;

  constructor() {
    super('PreloadScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  preload() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // --- Loading UI ---
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x111111, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 50, 320, 10);
    progressBox.lineStyle(1, theme.primary, 0.2);
    progressBox.strokeRect(width / 2 - 160, height / 2 + 50, 320, 10);

    const loadingText = this.add.text(width / 2, height / 2 + 30, 'NEST_SYSTEM_SYNCING...', {
      fontFamily: theme.fontPrimary, fontSize: '12px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, letterSpacing: 4
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(theme.primary, 0.8);
      progressBar.fillRect(width / 2 - 160, height / 2 + 50, 320 * value, 10);
      loadingText.setText(`SYNC_INTENSITY: ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // --- Essential Assets ---
    // Backgrounds (Standardized to the 10 Themes)
    this.load.image('bg_survival', '/assets/type-bgs/survival.png');
    this.load.image('bg_power', '/assets/type-bgs/power.png');
    this.load.image('bg_adapt', '/assets/type-bgs/adapt.png');
    this.load.image('bg_chaos', '/assets/type-bgs/chaos.png');
    this.load.image('bg_disaster', '/assets/type-bgs/disaster.png');
    this.load.image('bg_cataclysm', '/assets/type-bgs/cataclysm.png');
    this.load.image('bg_ascended', '/assets/type-bgs/ascended.png');
    this.load.image('bg_twist', '/assets/type-bgs/twist.png');

    // UI & Card Parts
    this.load.image('card_frame', '/assets/ui_card_frame.png');
    this.load.image('card_back', '/cards/deck_back.jpg');
    this.load.image('particle_glow', '/assets/fx/particle_glow.png');
    this.load.image('vignette', '/assets/fx/vignette.png');
    this.load.image('noise', '/assets/fx/noise.png');
  }

  create() {
    this.scene.start('HomeScene');
  }
}
