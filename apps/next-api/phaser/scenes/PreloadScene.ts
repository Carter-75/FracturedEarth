import Phaser from 'phaser';
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
    // Backgrounds
    this.load.image('bg_survival', '/backgrounds/survival.jpg');
    this.load.image('bg_home', '/backgrounds/home_bg.jpg'); // New cinematic bg
    this.load.image('bg_power', '/backgrounds/power.jpg');
    this.load.image('bg_adapt', '/backgrounds/adapt.jpg');
    this.load.image('bg_chaos', '/backgrounds/chaos.jpg');

    // Type backgrounds
    this.load.image('bg_power', '/backgrounds/type_power.jpg');
    this.load.image('bg_survival', '/backgrounds/type_survival.jpg');
    this.load.image('bg_disaster', '/backgrounds/type_disaster.jpg');
    this.load.image('bg_cataclysm', '/backgrounds/type_cataclysm.jpg');
    this.load.image('bg_adaptation', '/backgrounds/type_adapt.jpg');
    this.load.image('bg_twist', '/backgrounds/type_twist.jpg');

    // UI & Card Parts
    this.load.image('card_frame', '/cards/frame_default.png');
    this.load.image('card_back', '/cards/card_back.png');
    this.load.image('particle_glow', '/particles/glow.png');
  }

  create() {
    this.scene.start('HomeScene');
  }
}
