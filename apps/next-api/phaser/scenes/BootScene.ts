import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Basic loading assets for the Preload screen itself
    this.load.image('particle_glow', '/particles/glow.png');
  }

  create() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    const theme = THEMES.find(t => t.name === themeName) || THEMES[0];

    const { width, height } = this.scale;
    
    // Initial pulse sequence
    const logo = this.add.text(width / 2, height / 2, 'FRACTURED_EARTH', {
        fontFamily: theme.fontPrimary,
        fontSize: '48px',
        fontStyle: 'bold italic',
        color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba,
        letterSpacing: 15
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
        targets: logo,
        alpha: 1,
        duration: 1000,
        yoyo: true,
        onComplete: () => {
            this.scene.start('PreloadScene');
        }
    });

    // Ambient glow in boot
    this.add.particles(width / 2, height / 2, 'particle_glow', {
        speed: 100,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 2000,
        tint: theme.particle,
        blendMode: 'ADD',
        frequency: 200
    });
  }
}
